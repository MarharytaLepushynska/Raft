/** Time range the statistics are aggregated over. */
export type StatsPeriod = 'WEEK' | 'MONTH' | 'YEAR';

/** One bar/point of a chart: `label` (x-axis) with a `count` and/or money `amount`. */
export interface ChartPointResponse {
    label: string;
    count: number;
    amount?: number;
}

/** A workspace with how many tasks are assigned in it (for the "top workspaces" list). */
export interface WorkspaceTaskCountResponse {
    workspaceId: string;
    workspaceName: string;
    taskCount: number;
}

/** Data for the statistics page: task and expense series plus the top workspaces. */
export interface StatisticsResponse {
    taskStats: ChartPointResponse[];
    expenseStats: ChartPointResponse[];
    topWorkspaces: WorkspaceTaskCountResponse[];
}
