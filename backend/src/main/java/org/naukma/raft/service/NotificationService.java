package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.NotificationResponse;
import org.naukma.raft.entity.Notification;
import org.naukma.raft.entity.User;
import org.naukma.raft.enums.NotificationType;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.NotificationRepository;
import org.naukma.raft.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service responsible for user notifications.
 *
 * Provides methods for reading, marking, deleting and creating notifications
 * of different types such as reminders, achievements, chat messages and system events.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Returns all notifications for a user, newest first.
     *
     * @param userId ID of the current user
     * @return list of notification responses
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns only unread notifications for a user.
     *
     * @param userId ID of the current user
     * @return list of unread notification responses
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Counts unread notifications for a user.
     *
     * @param userId ID of the current user
     * @return number of unread notifications
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    /**
     * Marks a specific user notification as read.
     *
     * @param userId ID of the current user
     * @param notificationId ID of the notification
     * @return updated notification response
     */
    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = getUserNotification(userId, notificationId);
        notification.setRead(true);

        return mapToResponse(notificationRepository.save(notification));
    }

    /**
     * Marks all unread notifications of the user as read.
     *
     * @param userId ID of the current user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications =
                notificationRepository.findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId);

        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    /**
     * Deletes a specific notification owned by the user.
     *
     * @param userId ID of the current user
     * @param notificationId ID of the notification to delete
     */
    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = getUserNotification(userId, notificationId);
        notificationRepository.delete(notification);
    }

    /**
     * Creates a new unread notification for a user.
     *
     * This method is used by other services when some important event happens.
     *
     * @param userId ID of the notification recipient
     * @param type notification type
     * @param title notification title
     * @param message notification message
     * @param sourceId optional related entity ID
     * @return created notification response
     */
    @Transactional
    public NotificationResponse createNotification(
            Long userId,
            NotificationType type,
            String title,
            String message,
            Long sourceId
    ) {
        User user = getUser(userId);

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .sourceId(sourceId)
                .read(false)
                .build();

        return mapToResponse(notificationRepository.save(notification));
    }

    /**
     * Finds a notification that belongs to a specific user.
     *
     * This method prevents users from accessing or modifying notifications
     * that belong to other accounts.
     *
     * @param userId ID of the current user
     * @param notificationId ID of the notification to find
     * @return notification entity owned by the user
     */
    private Notification getUserNotification(Long userId, Long notificationId) {
        return notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
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
     * Converts a Notification entity into a NotificationResponse DTO.
     *
     * The response contains notification type, title, message, related source ID,
     * read status and creation time.
     *
     * @param notification notification entity to convert
     * @return notification response DTO
     */
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId().toString())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .sourceId(notification.getSourceId() == null ? null : notification.getSourceId().toString())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}