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

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = getUserNotification(userId, notificationId);
        notification.setRead(true);

        return mapToResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications =
                notificationRepository.findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId);

        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = getUserNotification(userId, notificationId);
        notificationRepository.delete(notification);
    }

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

    private Notification getUserNotification(Long userId, Long notificationId) {
        return notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

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