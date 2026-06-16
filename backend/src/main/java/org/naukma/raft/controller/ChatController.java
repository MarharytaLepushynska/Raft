package org.naukma.raft.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.ChatMessagePatchRequest;
import org.naukma.raft.dto.request.ChatMessageRequest;
import org.naukma.raft.dto.response.ChatMessageResponse;
import org.naukma.raft.dto.response.ChatUnreadCountResponse;
import org.naukma.raft.dto.response.ChatSummaryResponse;
import org.naukma.raft.security.CustomUserDetails;
import org.naukma.raft.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for shared workspace group chats, messaging, and unread counters.
 */
@RestController
@RequestMapping("api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** Retrieves recent messages for a specific workspace chat with adjustable limits. */
    @GetMapping("/workspaces/{workspaceId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(chatService.getWorkspaceMessages(user.getId(), workspaceId, limit));
    }

    /** Dispatches a new message into the designated workspace chat room. */
    @PostMapping("/workspaces/{workspaceId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long workspaceId,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(chatService.sendMessage(user.getId(), workspaceId, request));
    }

    /** Edits the text content of an existing message if owned by the user. */
    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> updateMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long messageId,
            @Valid @RequestBody ChatMessagePatchRequest request
    ) {
        return ResponseEntity.ok(chatService.updateMessage(user.getId(), messageId, request));
    }

    /** Permanently removes a chat message from the conversation logs. */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long messageId
    ) {
        chatService.deleteMessage(user.getId(), messageId);
        return ResponseEntity.noContent().build();
    }

    /** Resets the unread message counter for the current user in a workspace. */
    @PostMapping("/workspaces/{workspaceId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long workspaceId
    ) {
        chatService.markWorkspaceAsRead(user.getId(), workspaceId);
        return ResponseEntity.noContent().build();
    }

    /** Fetches counts of unread messages across all active workspaces. */
    @GetMapping("/workspaces/unread-counts")
    public ResponseEntity<List<ChatUnreadCountResponse>> getUnreadCounts(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(chatService.getUnreadCounts(user.getId()));
    }

    /** Gets a overview list of chats with message previews and unread badges. */
    @GetMapping("/workspaces")
    public ResponseEntity<List<ChatSummaryResponse>> getWorkspaceChats(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(chatService.getWorkspaceChatSummaries(user.getId()));
    }
}