package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Notification badge counter payload mapped to a single workspace node.
 */
@Data
@Builder
public class ChatUnreadCountResponse {

    private String workspaceId;

    private String workspaceName;

    private long unreadCount;
}