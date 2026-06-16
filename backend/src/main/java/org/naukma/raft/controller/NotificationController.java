package org.naukma.raft.controller;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.response.NotificationResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller organizing push alerts, workspace actions, and user inbox warnings.
 */
@RestController
@RequestMapping("api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Returns an extensive log history of both seen and fresh alert frames. */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getId()));
    }

    /** Returns an isolated view stream containing active unread communications. */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user.getId()));
    }

    /** Pulls a fast numerical tally representing pending unread activities. */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                Map.of("count", notificationService.getUnreadCount(user.getId()))
        );
    }

    /** Seals a singular active alert record as read by the user. */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(user.getId(), id));
    }

    /** Flushes all active notification flags into an evaluated/read state. */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    /** Removes an alert row permanently from the user's dashboard ledger. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        notificationService.deleteNotification(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}