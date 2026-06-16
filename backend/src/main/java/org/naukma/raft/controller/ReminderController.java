package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ReminderPatchRequest;
import org.naukma.raft.dto.request.ReminderRequest;
import org.naukma.raft.dto.response.ReminderResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.ReminderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller handling task deadlines, time trackers, and countdown prompts.
 */
@RestController
@RequestMapping("api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    /** Discovers active time triggers and alarms initialized for the profile. */
    @GetMapping
    public ResponseEntity<List<ReminderResponse>> getReminders(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(reminderService.getReminders(user.getId()));
    }

    /** Seeds a designated time alarm correlated with task priorities or checklists. */
    @PostMapping
    public ResponseEntity<ReminderResponse> createReminder(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody ReminderRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reminderService.createReminder(user.getId(), request));
    }

    /** Overrides trigger hours or toggle configurations for an alarming task tracker. */
    @PatchMapping("/{id}")
    public ResponseEntity<ReminderResponse> updateReminder(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody ReminderPatchRequest request
    ) {
        return ResponseEntity.ok(reminderService.updateReminder(user.getId(), id, request));
    }

    /** Snaps off a countdown tracking alarm sequence. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        reminderService.deleteReminder(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}