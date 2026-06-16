package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.MemberRequest;
import org.naukma.raft.dto.request.WorkspaceRequest;
import org.naukma.raft.dto.request.WorkspaceUpdateRequest;
import org.naukma.raft.dto.response.MemberResponse;
import org.naukma.raft.dto.response.WorkspaceDetailResponse;
import org.naukma.raft.dto.response.WorkspaceResponse;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.entity.WorkspaceMember;
import org.naukma.raft.enums.MemberRole;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.TaskRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.naukma.raft.repository.WorkspaceRepository;
import org.naukma.raft.repository.ChatMessageRepository;
import org.naukma.raft.repository.ChatReadStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service responsible for workspace management.
 *
 * Handles personal and shared workspaces, membership, roles, access control,
 * system notifications and cleanup of related workspace data.
 */
@Service
@RequiredArgsConstructor
public class WorkspaceService {
    private static final WorkspaceColor DEFAULT_COLOR = WorkspaceColor.ROSE;

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final AchievementService achievementService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatReadStateRepository chatReadStateRepository;
    private final NotificationService notificationService;

    /**
     * Returns all workspaces available to the user.
     *
     * Ensures that the user has a personal workspace before returning the list.
     *
     * @param userId ID of the current user
     * @return list of workspace responses
     */
    @Transactional
    public List<WorkspaceResponse> getWorkspaces(Long userId) {
        ensurePersonalWorkspace(userId);

        Map<Long, Workspace> workspaces = new LinkedHashMap<>();
        Map<Long, MemberRole> roles = new LinkedHashMap<>();

        for (Workspace workspace : workspaceRepository.findByOwner_Id(userId)) {
            workspaces.put(workspace.getId(), workspace);
            roles.put(workspace.getId(), MemberRole.ADMIN);
        }
        for (WorkspaceMember member : memberRepository.findByUser_Id(userId)) {
            Workspace workspace = member.getWorkspace();
            if (workspaces.putIfAbsent(workspace.getId(), workspace) == null) {
                roles.put(workspace.getId(), member.getRole());
            }
        }

        Map<Long, Integer> counts = memberCounts(workspaces.keySet());

        return workspaces.values().stream()
                .map(workspace -> toResponse(
                        workspace,
                        roles.get(workspace.getId()),
                        counts.getOrDefault(workspace.getId(), 0)))
                .toList();
    }

    /**
     * Ensures that the user has a personal workspace.
     *
     * If the personal workspace does not exist, it is created together with
     * an initial onboarding task.
     *
     * @param userId ID of the user
     */
    @Transactional
    public void ensurePersonalWorkspace(Long userId) {
        User user = getUser(userId);
        Optional<Workspace> existing = workspaceRepository.findFirstByOwner_IdAndType(userId, WorkspaceType.PERSONAL);
        if (existing.isPresent()) {
            ensureOwnerMembership(existing.get(), user);
            return;
        }
        Workspace personal = createPersonalWorkspace(user);
        taskRepository.save(
                Task.builder()
                        .creator(user)
                        .assignee(user)
                        .workspace(personal)
                        .title("Explore Raft")
                        .description("This is your first task — open it to edit, mark it done, or add your own.")
                        .status(TaskStatus.TODO)
                        .priority(TaskPriority.MEDIUM)
                        .dueDate(LocalDate.now())
                        .build()
        );
    }

    /**
     * Returns the user's personal workspace or creates it if it does not exist.
     *
     * @param user user entity
     * @return personal workspace
     */
    @Transactional
    public Workspace getOrCreatePersonalWorkspace(User user) {
        return workspaceRepository.findFirstByOwner_IdAndType(user.getId(), WorkspaceType.PERSONAL)
                .map(workspace -> {
                    ensureOwnerMembership(workspace, user);
                    return workspace;
                })
                .orElseGet(() -> createPersonalWorkspace(user));
    }

    /**
     * Creates a new shared or personal workspace.
     *
     * The creator becomes an admin member. For shared workspaces, initial members
     * can be added by username, and system notifications are created for them.
     *
     * @param userId ID of the current user
     * @param request workspace creation data
     * @return created workspace response
     */
    private Workspace createPersonalWorkspace(User user) {
        Workspace personal = workspaceRepository.save(
                Workspace.builder()
                        .name("Personal")
                        .type(WorkspaceType.PERSONAL)
                        .color(WorkspaceColor.ROSE)
                        .owner(user)
                        .build()
        );
        saveMembership(personal, user, MemberRole.ADMIN);
        return personal;
    }

    @Transactional
    public WorkspaceResponse createWorkspace(Long userId, WorkspaceRequest request) {
        User user = getUser(userId);

        WorkspaceType type = request.getType() != null ? request.getType() : WorkspaceType.SHARED;

        Workspace workspace = workspaceRepository.save(
                Workspace.builder()
                        .name(request.getName().trim())
                        .type(type)
                        .color(resolveColor(request.getColor()))
                        .owner(user)
                        .build()
        );

        saveMembership(workspace, user, MemberRole.ADMIN);

        achievementService.awardAchievement(userId, "FIRST_WORKSPACE_CREATED");
        createWorkspaceCreatedNotification(user, workspace);

        if (type == WorkspaceType.SHARED && request.getMemberLogins() != null) {
            for (String loginValue : request.getMemberLogins()) {
                if (loginValue == null || loginValue.isBlank()) continue;
                User target = resolveExistingUser(loginValue);
                if (!isOwnerOrMember(workspace, target)) {
                    saveMembership(workspace, target, MemberRole.MEMBER);
                    createAddedToWorkspaceNotification(target, workspace);
                }
            }
        }

        return toResponse(workspace, MemberRole.ADMIN);
    }

    /**
     * Returns detailed workspace information, including members and current user's role.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     * @return workspace details
     */
    @Transactional(readOnly = true)
    public WorkspaceDetailResponse getWorkspace(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        MemberRole role = requireMember(workspace, userId);

        List<MemberResponse> members = memberRepository.findByWorkspace_Id(workspaceId)
                .stream()
                .map(this::toMemberResponse)
                .toList();

        return WorkspaceDetailResponse.builder()
                .id(workspace.getId().toString())
                .name(workspace.getName())
                .type(workspace.getType())
                .color(workspace.getColor())
                .role(role)
                .isOwner(workspace.getOwner().getId().equals(userId))
                .created(workspace.getCreated())
                .members(members)
                .build();
    }

    /**
     * Updates workspace settings.
     *
     * Only workspace admins can edit workspace name or color.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     * @param request workspace update data
     * @return updated workspace response
     */
    @Transactional
    public WorkspaceResponse updateWorkspace(Long userId, Long workspaceId, WorkspaceUpdateRequest request) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        MemberRole role = requireMember(workspace, userId);
        if (role != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can edit the workspace");
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            workspace.setName(request.getName().trim());
        }
        if (request.getColor() != null) {
            workspace.setColor(request.getColor());
        }
        return toResponse(workspaceRepository.save(workspace), role);
    }

    /**
     * Deletes a shared workspace.
     *
     * Personal workspaces cannot be deleted. Before deleting a workspace,
     * related chat messages, chat read states, tasks and memberships are removed.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     */
    @Transactional
    public void deleteWorkspace(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        if (requireMember(workspace, userId) != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can delete the workspace");
        }
        if (workspace.getType() == WorkspaceType.PERSONAL) {
            throw new ConflictException("You can't delete your personal space");
        }
        chatMessageRepository.deleteByWorkspace_Id(workspaceId);
        chatReadStateRepository.deleteByWorkspace_Id(workspaceId);
        taskRepository.deleteByWorkspace_Id(workspaceId);
        memberRepository.deleteByWorkspace_Id(workspaceId);
        workspaceRepository.delete(workspace);
    }

    /**
     * Adds a new member to a workspace.
     *
     * Only admins can add members. The added user receives a system notification.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     * @param request member creation data
     * @return created member response
     */
    @Transactional
    public MemberResponse addMember(Long userId, Long workspaceId, MemberRequest request) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        requireAdmin(workspace, userId);

        User target = resolveExistingUser(request.getLogin());

        if (isOwnerOrMember(workspace, target)) {
            throw new ConflictException("User is already a member");
        }

        MemberRole role = request.getRole() != null ? request.getRole() : MemberRole.MEMBER;
        WorkspaceMember member = saveMembership(workspace, target, role);

        createAddedToWorkspaceNotification(target, workspace);

        return toMemberResponse(member);
    }

    /**
     * Removes a member from a workspace.
     *
     * The workspace owner cannot be removed. Removed users receive a system notification.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     * @param memberUserId ID of the user to remove
     */
    @Transactional
    public void removeMember(Long userId, Long workspaceId, Long memberUserId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        requireAdmin(workspace, userId);

        if (workspace.getOwner().getId().equals(memberUserId)) {
            throw new ConflictException("Cannot remove the workspace owner");
        }

        WorkspaceMember member = memberRepository
                .findByWorkspace_IdAndUser_Id(workspaceId, memberUserId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        User removedUser = member.getUser();
        memberRepository.delete(member);
        chatReadStateRepository.deleteByWorkspace_IdAndUser_Id(workspaceId, memberUserId);
        createRemovedFromWorkspaceNotification(removedUser, workspace);
    }

    /**
     * Allows a user to leave a shared workspace.
     *
     * Workspace owners cannot leave their own workspace.
     *
     * @param userId ID of the current user
     * @param workspaceId workspace ID
     */
    @Transactional
    public void leaveWorkspace(Long userId, Long workspaceId) {
        Workspace workspace = getWorkspaceEntity(workspaceId);
        if (workspace.getOwner().getId().equals(userId)) {
            throw new ConflictException("Owner can't leave the workspace");
        }
        WorkspaceMember member = memberRepository
                .findByWorkspace_IdAndUser_Id(workspaceId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this workspace"));

        taskRepository.unassignUserFromTasksInWorkspace(workspaceId, userId);
        memberRepository.delete(member);
        chatReadStateRepository.deleteByWorkspace_IdAndUser_Id(workspaceId, userId);
    }

    /**
     * Finds a workspace by ID.
     *
     * @param workspaceId ID of the workspace to find
     * @return found workspace entity
     */
    private Workspace getWorkspaceEntity(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found"));
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
     * Resolves an existing user by username.
     *
     * The username is trimmed before searching.
     *
     * @param login username provided in the request
     * @return found user entity
     */
    private User resolveExistingUser(String login) {
        String username = login.trim();
        return userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
    }

    /**
     * Checks whether a user is already the owner or a member of a workspace.
     *
     * @param workspace workspace to check
     * @param user user to check
     * @return true if the user owns or belongs to the workspace
     */
    private boolean isOwnerOrMember(Workspace workspace, User user) {
        return workspace.getOwner().getId().equals(user.getId())
                || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), user.getId());
    }

    /**
     * Requires the user to be a workspace member and returns their role.
     *
     * @param workspace workspace entity
     * @param userId ID of the current user
     * @return user's role in the workspace
     */
    private MemberRole requireMember(Workspace workspace, Long userId) {
        if (workspace.getOwner().getId().equals(userId)) {
            return MemberRole.ADMIN;
        }
        return memberRepository.findByWorkspace_IdAndUser_Id(workspace.getId(), userId)
                .map(WorkspaceMember::getRole)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this workspace"));
    }

    /**
     * Requires the user to have admin permissions in a workspace.
     *
     * @param workspace workspace entity
     * @param userId ID of the current user
     */
    private void requireAdmin(Workspace workspace, Long userId) {
        if (requireMember(workspace, userId) != MemberRole.ADMIN) {
            throw new AccessDeniedException("Only admins can manage members");
        }
    }

    /**
     * Ensures that the workspace owner is also saved as a workspace member.
     *
     * If the owner does not have a membership record yet,
     * the method creates one with the ADMIN role.
     *
     * @param workspace workspace entity
     * @param owner workspace owner
     */
    private void ensureOwnerMembership(Workspace workspace, User owner) {
        if (!memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), owner.getId())) {
            saveMembership(workspace, owner, MemberRole.ADMIN);
        }
    }

    /**
     * Saves a workspace membership with the selected role.
     *
     * @param workspace workspace where the user is added
     * @param user user who becomes a workspace member
     * @param role member role in the workspace
     * @return saved workspace member entity
     */
    private WorkspaceMember saveMembership(Workspace workspace, User user, MemberRole role) {
        return memberRepository.save(
                WorkspaceMember.builder()
                        .workspace(workspace)
                        .user(user)
                        .role(role)
                        .build()
        );
    }

    /**
     * Converts a Workspace entity into a WorkspaceResponse DTO.
     *
     * Member count is loaded from the repository.
     *
     * @param workspace workspace entity to convert
     * @param role current user's role in the workspace
     * @return workspace response DTO
     */
    private WorkspaceResponse toResponse(Workspace workspace, MemberRole role) {
        return toResponse(workspace, role, (int) memberRepository.countByWorkspace_Id(workspace.getId()));
    }

    /**
     * Converts a Workspace entity into a WorkspaceResponse DTO.
     *
     * This overload accepts a precomputed member count to avoid extra database queries
     * when many workspaces are mapped at once.
     *
     * @param workspace workspace entity to convert
     * @param role current user's role in the workspace
     * @param memberCount number of workspace members
     * @return workspace response DTO
     */
    private WorkspaceResponse toResponse(Workspace workspace, MemberRole role, int memberCount) {
        return WorkspaceResponse.builder()
                .id(workspace.getId().toString())
                .name(workspace.getName())
                .type(workspace.getType())
                .color(workspace.getColor())
                .role(role)
                .memberCount(memberCount)
                .build();
    }

    /**
     * Calculates member counts for multiple workspaces.
     *
     * The result maps workspace ID to the number of members in that workspace.
     *
     * @param workspaceIds IDs of workspaces to count members for
     * @return map of workspace IDs to member counts
     */
    private Map<Long, Integer> memberCounts(Collection<Long> workspaceIds) {
        Map<Long, Integer> counts = new HashMap<>();
        if (workspaceIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : memberRepository.countByWorkspaceIdIn(workspaceIds)) {
            counts.put((Long) row[0], ((Long) row[1]).intValue());
        }
        return counts;
    }

    /**
     * Resolves workspace color.
     *
     * If no color was requested, the default workspace color is used.
     *
     * @param requested requested workspace color
     * @return requested color or default color
     */
    private WorkspaceColor resolveColor(WorkspaceColor requested) {
        return requested != null ? requested : DEFAULT_COLOR;
    }

    /**
     * Converts a WorkspaceMember entity into a MemberResponse DTO.
     *
     * The response includes membership ID, user profile data and member role.
     *
     * @param member workspace member entity to convert
     * @return member response DTO
     */
    private MemberResponse toMemberResponse(WorkspaceMember member) {
        User user = member.getUser();
        return MemberResponse.builder()
                .id(member.getId().toString())
                .userId(user.getId().toString())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(member.getRole())
                .build();
    }

    /**
     * Creates a system notification after workspace creation.
     *
     * @param user notification recipient
     * @param workspace created workspace
     */
    private void createWorkspaceCreatedNotification(User user, Workspace workspace) {
        notificationService.createNotification(
                user.getId(),
                NotificationType.SYSTEM,
                "Workspace created",
                "Workspace \"" + workspace.getName() + "\" was created successfully.",
                workspace.getId()
        );
    }

    /**
     * Creates a system notification when a user is added to a workspace.
     *
     * @param user notification recipient
     * @param workspace workspace where the user was added
     */
    private void createAddedToWorkspaceNotification(User user, Workspace workspace) {
        notificationService.createNotification(
                user.getId(),
                NotificationType.SYSTEM,
                "Added to workspace",
                "You were added to workspace \"" + workspace.getName() + "\".",
                workspace.getId()
        );
    }

    /**
     * Creates a system notification when a user is removed from a workspace.
     *
     * @param user notification recipient
     * @param workspace workspace from which the user was removed
     */
    private void createRemovedFromWorkspaceNotification(User user, Workspace workspace) {
        notificationService.createNotification(
                user.getId(),
                NotificationType.SYSTEM,
                "Removed from workspace",
                "You were removed from workspace \"" + workspace.getName() + "\".",
                workspace.getId()
        );
    }
}
