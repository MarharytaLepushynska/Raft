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

@RestController
@RequestMapping("/api/pins")
@RequiredArgsConstructor
public class PinController {

    private final PinService pinService;

    @GetMapping
    public ResponseEntity<List<PinResponse>> getPins(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(pinService.getPins(user.getId()));
    }

    @PostMapping
    public ResponseEntity<PinResponse> createPin(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody PinRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pinService.createPin(user.getId(), request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PinResponse> updatePinPosition(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody PinRequest request
    ) {
        return ResponseEntity.ok(pinService.updatePinPosition(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePin(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        pinService.deletePin(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
