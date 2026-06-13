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

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final WorkspaceMemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<ReminderResponse> getReminders(Long userId) {
        return reminderRepository.findByUser_IdOrderByReminderTimeAsc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

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

    @Transactional
    public void deleteReminder(Long userId, Long reminderId) {
        Reminder reminder = getUserReminder(userId, reminderId);
        reminderRepository.delete(reminder);
    }

    private void validateReminderTarget(Long taskId, Long eventId) {
        if (taskId == null && eventId == null) {
            throw new ConflictException("Reminder must be connected to task or event");
        }

        if (taskId != null && eventId != null) {
            throw new ConflictException("Reminder can be connected only to one target");
        }
    }

    private void validateReminderPatchTarget(ReminderPatchRequest request) {
        if (request.getTaskId() != null && request.getEventId() != null) {
            throw new ConflictException("Reminder can be connected only to one target");
        }
    }

    private Task getAccessibleTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!canAccess(userId, task.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this task");
        }

        return task;
    }

    private Event getAccessibleEvent(Long userId, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found"));

        if (!canAccess(userId, event.getWorkspace())) {
            throw new AccessDeniedException("You do not have access to this event");
        }

        return event;
    }

    private boolean canAccess(Long userId, Workspace workspace) {
        return workspace.getOwner().getId().equals(userId)
               || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Reminder getUserReminder(Long userId, Long reminderId) {
        return reminderRepository.findByIdAndUser_Id(reminderId, userId)
                .orElseThrow(() -> new NotFoundException("Reminder not found"));
    }

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