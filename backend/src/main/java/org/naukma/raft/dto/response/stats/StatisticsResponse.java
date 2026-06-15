package org.naukma.raft.dto.response.stats;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StatisticsResponse {
    private List<ChartPointResponse> taskStats;
    private List<ChartPointResponse> expenseStats;
    private List<WorkspaceTaskCountResponse> topWorkspaces;
}
