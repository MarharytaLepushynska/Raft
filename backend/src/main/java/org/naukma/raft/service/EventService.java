package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.EventPatchRequest;
import org.naukma.raft.dto.request.EventRequest;
import org.naukma.raft.dto.response.EventResponse;
import org.naukma.raft.entity.Event;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.EventRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Service responsible for managing calendar events.
 *
 * Provides operations for creating, reading, updating and deleting events
 * within workspaces accessible to the current user.
 */
@Service
@RequiredArgsConstructor
public class EventService {

    private static final WorkspaceColor PERSONAL_COLOR = WorkspaceColor.GRAY;

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    /**
     * Returns all events from workspaces accessible to the user.
     *
     * @param userId ID of the current user
     * @return list of event response DTOs ordered by start time
     */
    @Transactional(readOnly = true)
    public List<EventResponse> getEvents(Long userId) {
        Set<Long> workspaceIds = accessibleWorkspaceIds(userId);

        if (workspaceIds.isEmpty()) {
            return List.of();
        }

        return eventRepository.findByWorkspace_IdInOrderByStartTimeAsc(workspaceIds)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Creates a new event in a personal or selected workspace.
     *
     * @param userId ID of the current user
     * @param request event creation data
     * @return created event response
     */
    @Transactional
    public EventResponse createEvent(Long userId, EventRequest request) {
        validateEventTime(request.getStartTime(), request.getEndTime());

        User user = getUser(userId);
        Workspace workspace = resolveWorkspace(user, request.getWorkspaceId());

        Event event = Event.builder()
                .creator(user)
                .workspace(workspace)
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        return mapToResponse(eventRepository.save(event));
    }

    /**
     * Updates an existing event if the user has access to its workspace.
     *
     * @param userId ID of the current user
     * @param eventId ID of the event to update
     * @param request partial event update data
     * @return updated event response
     */
    @Transactional
    public EventResponse updateEvent(Long userId, Long eventId, EventPatchRequest request) {
        Event event = getAccessibleEvent(userId, eventId);

        LocalDateTime newStartTime = request.getStartTime() != null
                ? request.getStartTime()
                : event.getStartTime();

        LocalDateTime newEndTime = request.getEndTime() != null
                ? request.getEndTime()
                : event.getEndTime();

        validateEventTime(newStartTime, newEndTime);

        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) event.setEndTime(request.getEndTime());

        return mapToResponse(eventRepository.save(event));
    }

    /**
     * Deletes an event if the user has access to its workspace.
     *
     * @param userId ID of the current user
     * @param eventId ID of the event to delete
     */
    @Transactional
    public void deleteEvent(Long userId, Long eventId) {
        Event event = getAccessibleEvent(userId, eventId);
        eventRepository.delete(event);
    }

    /**
     * Resolves the workspace for an event.
     *
     * If no workspace ID is provided, the user's personal workspace is used.
     *
     * @param user current user
     * @param workspaceId optional workspace ID
     * @return resolved workspace
     */
    private Workspace resolveWorkspace(User user, Long workspaceId) {
        if (workspaceId == null) {
            return getOrCreatePersonalWorkspace(user);
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found"));

        if (!canAccess(user.getId(), workspace)) {
            throw new AccessDeniedException("You do not have access to this workspace");
        }

        return workspace;
    }

    /**
     * Finds an event and checks whether the current user has access to it.
     *
     * Access is allowed if the user owns the event's workspace
     * or is a member of that workspace.
     *
     * @param userId ID of the current user
     * @param eventId ID of the event to find
     * @return accessible event entity
     */
    private Event getAccessibleEvent(Long userId, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));

        if (!canAccess(userId, event.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this event");
        }

        return event;
    }

    /**
     * Checks whether a user can access a specific workspace.
     *
     * A user has access if they are the workspace owner
     * or if they are listed as a workspace member.
     *
     * @param userId ID of the current user
     * @param workspace workspace to check
     * @return true if the user has access to the workspace
     */
    private boolean canAccess(Long userId, Workspace workspace) {
        return workspace.getOwner().getId().equals(userId)
               || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    /**
     * Collects IDs of all workspaces available to the current user.
     *
     * The result includes workspaces owned by the user and workspaces
     * where the user is a member.
     *
     * @param userId ID of the current user
     * @return set of accessible workspace IDs
     */
    private Set<Long> accessibleWorkspaceIds(Long userId) {
        Set<Long> ids = new LinkedHashSet<>();

        workspaceRepository.findByOwner_Id(userId).forEach(workspace -> ids.add(workspace.getId()));
        memberRepository.findByUser_Id(userId).forEach(member -> ids.add(member.getWorkspace().getId()));

        return ids;
    }

    /**
     * Finds a user by ID.
     *
     * @param userId ID of the user to find
     * @return found user entity
     */
    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    /**
     * Returns the user's personal workspace or creates it if it does not exist.
     *
     * Personal workspace is used as the default workspace for personal events.
     *
     * @param user user who owns the personal workspace
     * @return existing or newly created personal workspace
     */
    private Workspace getOrCreatePersonalWorkspace(User user) {
        return workspaceRepository
                .findFirstByOwner_IdAndType(user.getId(), WorkspaceType.PERSONAL)
                .orElseGet(() -> workspaceRepository.save(
                        Workspace.builder()
                                .name("Personal")
                                .type(WorkspaceType.PERSONAL)
                                .color(PERSONAL_COLOR)
                                .owner(user)
                                .build()
                ));
    }

    /**
     * Validates that an event ends after it starts.
     *
     * @param startTime event start time
     * @param endTime event end time
     */
    private void validateEventTime(LocalDateTime startTime, LocalDateTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new ConflictException("End time must be after start time");
        }
    }

    /**
     * Converts an Event entity into an EventResponse DTO.
     *
     * The response includes event details and basic information about
     * the workspace where the event belongs.
     *
     * @param event event entity to convert
     * @return response DTO with event and workspace data
     */
    private EventResponse mapToResponse(Event event) {
        Workspace workspace = event.getWorkspace();

        return EventResponse.builder()
                .id(event.getId().toString())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .workspaceId(workspace.getId().toString())
                .workspaceName(workspace.getName())
                .workspaceColor(workspace.getColor())
                .build();
    }
}