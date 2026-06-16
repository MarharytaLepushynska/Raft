package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ReminderRequest;
import org.naukma.raft.dto.request.ReminderPatchRequest;
import org.naukma.raft.dto.response.ReminderResponse;
import org.naukma.raft.entity.Event;
import org.naukma.raft.entity.Reminder;
import org.naukma.raft.entity.Task;
import org.naukma.raft.entity.User;
import org.naukma.raft.entity.Workspace;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.EventRepository;
import org.naukma.raft.repository.ReminderRepository;
import org.naukma.raft.repository.TaskRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.util.List;
import java.time.LocalDateTime;

/**
 * Service responsible for user reminders.
 *
 * Reminders can be attached either to tasks or events and are later processed
 * by the scheduler when their reminder time comes.
 */
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final NotificationService notificationService;

    /**
     * Returns reminders created by the user, ordered by reminder time.
     *
     * @param userId ID of the current user
     * @return list of reminder responses
     */
    @Transactional(readOnly = true)
    public List<ReminderResponse> getReminders(Long userId) {
        return reminderRepository.findByUser_IdOrderByReminderTimeAsc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Creates a new reminder connected to either a task or an event.
     *
     * @param userId ID of the current user
     * @param request reminder creation data
     * @return created reminder response
     */
    @Transactional
    public ReminderResponse createReminder(Long userId, ReminderRequest request) {
        validateReminderTarget(request.getTaskId(), request.getEventId());

        User user = getUser(userId);

        Task task = null;
        Event event = null;

        if (request.getTaskId() != null) {
            task = getAccessibleTask(userId, request.getTaskId());
        }

        if (request.getEventId() != null) {
            event = getAccessibleEvent(userId, request.getEventId());
        }

        Reminder reminder = Reminder.builder()
                .user(user)
                .task(task)
                .event(event)
                .reminderTime(request.getReminderTime())
                .isSent(false)
                .build();

        return mapToResponse(reminderRepository.save(reminder));
    }

    /**
     * Updates an existing reminder owned by the user.
     *
     * A reminder can be reassigned to a task or an event, but not both at once.
     *
     * @param userId ID of the current user
     * @param reminderId ID of the reminder to update
     * @param request partial reminder update data
     * @return updated reminder response
     */
    @Transactional
    public ReminderResponse updateReminder(Long userId, Long reminderId, ReminderPatchRequest request) {
        validateReminderPatchTarget(request);

        Reminder reminder = getUserReminder(userId, reminderId);

        if (request.getTaskId() != null) {
            Task task = getAccessibleTask(userId, request.getTaskId());
            reminder.setTask(task);
            reminder.setEvent(null);
        }

        if (request.getEventId() != null) {
            Event event = getAccessibleEvent(userId, request.getEventId());
            reminder.setEvent(event);
            reminder.setTask(null);
        }

        if (request.getReminderTime() != null) {
            reminder.setReminderTime(request.getReminderTime());
        }

        return mapToResponse(reminderRepository.save(reminder));
    }

    /**
     * Deletes a reminder owned by the user.
     *
     * @param userId ID of the current user
     * @param reminderId ID of the reminder to delete
     */
    @Transactional
    public void deleteReminder(Long userId, Long reminderId) {
        Reminder reminder = getUserReminder(userId, reminderId);
        reminderRepository.delete(reminder);
    }

    /**
     * Validates that a reminder is connected to exactly one target:
     * either a task or an event.
     *
     * @param taskId optional task ID
     * @param eventId optional event ID
     */
    private void validateReminderTarget(Long taskId, Long eventId) {
        if (taskId == null && eventId == null) {
            throw new ConflictException("Reminder must be connected to task or event");
        }

        if (taskId != null && eventId != null) {
            throw new ConflictException("Reminder can be connected only to one target");
        }
    }

    /**
     * Processes reminders whose reminder time has already come.
     *
     * For each due reminder, the method creates a notification and marks the reminder as sent.
     *
     * @return number of processed reminders
     */
    @Transactional
    public int processDueReminders() {
        List<Reminder> dueReminders = reminderRepository.findDueReminders(LocalDateTime.now(ZoneId.of("Europe/Kyiv")));

        dueReminders.forEach(reminder -> {
            notificationService.createNotification(
                    reminder.getUser().getId(),
                    NotificationType.REMINDER,
                    "Reminder",
                    buildReminderMessage(reminder),
                    reminder.getId()
            );

            reminder.setSent(true);
        });

        reminderRepository.saveAll(dueReminders);

        return dueReminders.size();
    }

    /**
     * Validates that a reminder patch request does not connect the reminder
     * to both a task and an event at the same time.
     *
     * A reminder can be attached to only one target.
     *
     * @param request reminder update request
     */
    private void validateReminderPatchTarget(ReminderPatchRequest request) {
        if (request.getTaskId() != null && request.getEventId() != null) {
            throw new ConflictException("Reminder can be connected only to one target");
        }
    }

    /**
     * Finds a task and checks whether the current user has access to it.
     *
     * Access is allowed if the user owns the task workspace
     * or is a member of that workspace.
     *
     * @param userId ID of the current user
     * @param taskId ID of the task to find
     * @return accessible task entity
     */
    private Task getAccessibleTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!canAccess(userId, task.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this task");
        }

        return task;
    }

    /**
     * Finds an event and checks whether the current user has access to it.
     *
     * Access is allowed if the user owns the event workspace
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
     * Checks whether a user has access to a workspace.
     *
     * A user has access if they are the workspace owner
     * or a member of that workspace.
     *
     * @param userId ID of the current user
     * @param workspace workspace to check
     * @return true if the user can access the workspace
     */
    private boolean canAccess(Long userId, Workspace workspace) {
        return workspace.getOwner().getId().equals(userId)
               || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
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
     * Finds a reminder that belongs to the current user.
     *
     * This prevents users from reading, updating or deleting reminders
     * created by other users.
     *
     * @param userId ID of the current user
     * @param reminderId ID of the reminder to find
     * @return reminder entity owned by the user
     */
    private Reminder getUserReminder(Long userId, Long reminderId) {
        return reminderRepository.findByIdAndUser_Id(reminderId, userId)
                .orElseThrow(() -> new NotFoundException("Reminder not found"));
    }

    /**
     * Builds the notification message for a due reminder.
     *
     * @param reminder due reminder
     * @return notification message text
     */
    private String buildReminderMessage(Reminder reminder) {
        if (reminder.getTask() != null) {
            return "Task reminder: " + reminder.getTask().getTitle();
        }

        if (reminder.getEvent() != null) {
            return "Event reminder: " + reminder.getEvent().getTitle();
        }

        return "Reminder time has come";
    }

    /**
     * Converts a Reminder entity into a ReminderResponse DTO.
     *
     * The response includes reminder target IDs, reminder time
     * and information about whether the reminder was already sent.
     *
     * @param reminder reminder entity to convert
     * @return reminder response DTO
     */
    private ReminderResponse mapToResponse(Reminder reminder) {
        return ReminderResponse.builder()
                .id(reminder.getId().toString())
                .taskId(reminder.getTask() == null ? null : reminder.getTask().getId().toString())
                .eventId(reminder.getEvent() == null ? null : reminder.getEvent().getId().toString())
                .reminderTime(reminder.getReminderTime())
                .sent(reminder.isSent())
                .build();
    }
}
