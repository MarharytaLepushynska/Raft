package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.PinRequest;
import org.naukma.raft.dto.response.PinResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.PinService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for grid canvas elements, widgets, or shortcuts pinned on workspace profiles.
 */
@RestController
@RequestMapping("/api/pins")
@RequiredArgsConstructor
public class PinController {

    private final PinService pinService;

    /** Lists out coordinates and data mappings for canvas pinned frames. */
    @GetMapping
    public ResponseEntity<List<PinResponse>> getPins(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(pinService.getPins(user.getId()));
    }

    /** Creates a pinned shortcut framework onto a board setup. */
    @PostMapping
    public ResponseEntity<PinResponse> createPin(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody PinRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pinService.createPin(user.getId(), request));
    }

    /** Re-aligns visual coordinates or sorting positions for a canvas dashboard card. */
    @PatchMapping("/{id}")
    public ResponseEntity<PinResponse> updatePinPosition(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody PinRequest request
    ) {
        return ResponseEntity.ok(pinService.updatePinPosition(user.getId(), id, request));
    }

    /** Drops a canvas pin structure off the active view layout. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePin(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        pinService.deletePin(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
