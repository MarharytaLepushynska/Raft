package org.naukma.raft.repository;

import org.naukma.raft.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for accessing user notifications.
 *
 * Provides methods for retrieving all notifications, unread notifications,
 * user-owned notifications and unread notification counts.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Finds all notifications for a user ordered from newest to oldest.
     *
     * @param userId ID of the user
     * @return list of user notifications
     */
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Finds unread notifications for a user ordered from newest to oldest.
     *
     * @param userId ID of the user
     * @return list of unread notifications
     */
    List<Notification> findByUser_IdAndReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Finds a notification by ID only if it belongs to the selected user.
     *
     * @param id notification ID
     * @param userId ID of the notification owner
     * @return notification, if it belongs to the user
     */
    Optional<Notification> findByIdAndUser_Id(Long id, Long userId);

    /**
     * Counts unread notifications for a user.
     *
     * @param userId ID of the user
     * @return number of unread notifications
     */
    long countByUser_IdAndReadFalse(Long userId);
}