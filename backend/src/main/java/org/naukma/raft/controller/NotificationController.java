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

@RestController
@RequestMapping("api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getId()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                Map.of("count", notificationService.getUnreadCount(user.getId()))
        );
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(user.getId(), id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        notificationService.deleteNotification(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}