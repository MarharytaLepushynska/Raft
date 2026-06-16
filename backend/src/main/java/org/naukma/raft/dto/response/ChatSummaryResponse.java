package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Summary row mapping chat activity previews and unread badges for dashboard displays.
 */
@Data
@Builder
public class ChatSummaryResponse {

    private String workspaceId;

    private String workspaceName;

    private String lastMessageId;

    private String lastMessageContent;

    private UserSummaryResponse lastMessageSender;

    private LocalDateTime lastMessageAt;

    private long unreadCount;
}