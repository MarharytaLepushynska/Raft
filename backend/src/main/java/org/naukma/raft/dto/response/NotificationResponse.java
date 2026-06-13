package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private String id;

    private NotificationType type;

    private String title;

    private String message;

    private String sourceId;

    private boolean read;

    private LocalDateTime createdAt;
}