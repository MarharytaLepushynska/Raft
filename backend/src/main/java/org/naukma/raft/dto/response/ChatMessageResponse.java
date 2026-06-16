package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Context container representing a message entry fetched from a group chat room.
 */
@Data
@Builder
public class ChatMessageResponse {

    private String id;

    private String workspaceId;
    private String workspaceName;

    private UserSummaryResponse sender;

    private String content;
    private boolean edited;
    private boolean ownMessage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}