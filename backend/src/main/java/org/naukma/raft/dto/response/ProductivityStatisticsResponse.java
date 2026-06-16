package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Comprehensive analytical metric sheets tracking user performance and goal progression profiles.
 */
@Data
@Builder
public class ProductivityStatisticsResponse {

    private long totalTasks;

    private long todoTasks;

    private long inProgressTasks;

    private long completedTasks;

    private long overdueTasks;

    private long dueTodayTasks;

    private long dueThisWeekTasks;

    private double completionRate;

    private long upcomingReminders;

    private long earnedAchievements;

    private long totalAchievements;

    private double achievementRate;

    private long unreadNotifications;
}