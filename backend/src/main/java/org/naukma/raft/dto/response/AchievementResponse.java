package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Data payload returned to display an achievement and its completion status for the user.
 */
@Data
@Builder
public class AchievementResponse {

    private String id;

    private String code;

    private String title;

    private String description;

    private String icon;

    private boolean earned;

    private LocalDateTime earnedAt;
}