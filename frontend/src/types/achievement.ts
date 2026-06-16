/** An achievement and whether the current user has earned it. */
export interface Achievement {
    id: string;
    /** Stable backend code, e.g. `TASKS_10` (used to grant/look it up). */
    code: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
}
