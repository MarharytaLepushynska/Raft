export type StatsPeriod = 'WEEK' | 'MONTH' | 'YEAR';

export interface ChartPointResponse {
    label: string;
    count: number;
    amount?: number;
}

export interface WorkspaceTaskCountResponse {
    workspaceId: string;
    workspaceName: string;
    taskCount: number;
}

export interface StatisticsResponse {
    taskStats: ChartPointResponse[];
    expenseStats: ChartPointResponse[];
    topWorkspaces: WorkspaceTaskCountResponse[];
}
