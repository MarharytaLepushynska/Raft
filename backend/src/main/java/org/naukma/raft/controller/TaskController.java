package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.TaskPatchRequest;
import org.naukma.raft.dto.request.TaskRequest;
import org.naukma.raft.dto.response.TaskResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller handling task management, progress updates, and personal checklists.
 */
@RestController
@RequestMapping("api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    /** Gathers a sequence tracking open or structured tasks allocated to the user. */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(taskService.getTasks(user.getId()));
    }

    /** Appends a new item into the user's checklist agenda. */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@AuthenticationPrincipal CustomUserDetails user,
                                                   @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(user.getId(), request));
    }

    /** Updates properties of a checklist card, such as status toggles or description bounds. */
    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@AuthenticationPrincipal CustomUserDetails user,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody TaskPatchRequest request) {
        return ResponseEntity.ok(taskService.updateTask(user.getId(), id, request));
    }

    /** Removes a specific task card from active workspace view limits. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@AuthenticationPrincipal CustomUserDetails user,
                                           @PathVariable Long id) {
        taskService.deleteTask(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
