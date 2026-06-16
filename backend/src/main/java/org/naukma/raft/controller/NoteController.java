package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.NotePatchRequest;
import org.naukma.raft.dto.request.NoteRequest;
import org.naukma.raft.dto.response.NoteResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing plain or rich text documents, notes, and records.
 */
@RestController
@RequestMapping("api/notes")
@RequiredArgsConstructor
public class NoteController {
    private final NoteService noteService;

    /** Compiles a complete list of notebooks and loose documentation items. */
    @GetMapping
    public ResponseEntity<List<NoteResponse>> getNotes(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(noteService.getNotes(user.getId()));
    }

    /** Saves a fresh text record or workspace documentation sheet. */
    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(noteService.createNote(user.getId(), request));
    }

    /** Updates text content, headings, or nested hierarchy properties of a note. */
    @PatchMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody NotePatchRequest request) {
        return ResponseEntity.ok(noteService.updateNote(user.getId(), id, request));
    }

    /** Moves a text sheet into deletion logs or permanent trash. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id) {
        noteService.deleteNote(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    /** Scans structural content and header tags to query specific matched notes. */
    @GetMapping("/search")
    public ResponseEntity<List<NoteResponse>> searchNotes(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam String search,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(noteService.searchNotes(user.getId(), search, limit));
    }
}
