package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ProfileUpdateRequest;
import org.naukma.raft.dto.response.UserResponse;
import org.naukma.raft.dto.response.UserSummaryResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for self-profile modifications and lookups within global system user indices.
 */
@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    /** Pulls down administrative and credential mappings bound to the session account. */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(userService.getUserById(user.getId()));
    }

    /** Searches the platform identity ledger to discover contacts by keywords or username segments. */
    @GetMapping("/search")
    public ResponseEntity<List<UserSummaryResponse>> search(@RequestParam String q,
                                                            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(userService.searchUsers(q, user.getId()));
    }

    /** Modifies personal account parameters, custom settings, or display names. */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(@AuthenticationPrincipal CustomUserDetails user,
                                                          @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUser(user.getId(), request));
    }

    /** Triggers termination sequences to flush user profile matrices from server indexes. */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser(@AuthenticationPrincipal CustomUserDetails user) {
        userService.deleteUser(user.getId());
        return ResponseEntity.noContent().build();
    }
}
