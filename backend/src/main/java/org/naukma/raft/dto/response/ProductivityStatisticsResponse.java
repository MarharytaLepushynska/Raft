package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductivityStatisticsResponse {

    private long totalTasks;

    private long todoTasks;

    private long inProgressTasks;

    private long completedTasks;

    private long overdueTasks;

    private double completionRate;
}