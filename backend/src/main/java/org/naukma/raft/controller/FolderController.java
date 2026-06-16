package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.FolderPatchRequest;
import org.naukma.raft.dto.request.FolderRequest;
import org.naukma.raft.dto.response.FolderResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.FolderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller handling directories and categorical binders for user assets or files.
 */
@RestController
@RequestMapping("api/folders")
@RequiredArgsConstructor
public class FolderController {
    private final FolderService folderService;

    /** Retrieves all available storage binders accessible by the current profile. */
    @GetMapping
    public ResponseEntity<List<FolderResponse>> getFolders(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(folderService.getFolders(user.getId()));
    }

    /** Spawns a new workspace or dashboard context binder. */
    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody FolderRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(folderService.createFolder(user.getId(), request));
    }

    /** Renames or realigns settings of an existing organizational binder. */
    @PatchMapping("/{id}")
    public ResponseEntity<FolderResponse> updateFolder(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody FolderPatchRequest request
    ) {
        return ResponseEntity.ok(folderService.updateFolder(user.getId(), id, request));
    }

    /** Discards a folder, affecting its internal structural indices. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id
    ) {
        folderService.deleteFolder(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
