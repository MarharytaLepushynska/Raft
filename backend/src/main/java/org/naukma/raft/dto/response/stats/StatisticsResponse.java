package org.naukma.raft.dto.response.stats;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Aggregated response payload carrying productivity, financial, and workspace statistics.
 */
@Data
@Builder
public class StatisticsResponse {
    /** Data points for rendering task completion charts. */
    private List<ChartPointResponse> taskStats;
    /** Data points for rendering shared or personal expense analytics. */
    private List<ChartPointResponse> expenseStats;
    /** List of the most active environments sorted by their task volume. */
    private List<WorkspaceTaskCountResponse> topWorkspaces;
}
