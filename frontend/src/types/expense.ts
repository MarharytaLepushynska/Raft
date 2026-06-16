/** Public user info as returned by the expenses endpoints. */
export interface UserSummaryResponse {
    id: string,
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

/** One person's share of an expense, and whether they've paid it back. */
export interface ExpenseSplitResponse {
    id: string;
    user: UserSummaryResponse;
    share: number;
    isSettled: boolean;
}

/** An expense: who paid, the total, and how it's split among participants. */
export interface ExpenseResponse {
    id: string;
    title: string;
    amount: number;
    paidBy: UserSummaryResponse;
    splits: ExpenseSplitResponse[];
    createdAt: string;
}

/** How much one person owes (or is owed), with the expenses behind it. */
export interface DebtSummaryResponse {
    user: UserSummaryResponse;
    amount: number;
    relatedExpenses: ExpenseResponse[];
}

/** A member's standing in a workspace: total paid, total owed, and net `balance`. */
export interface UserBalanceResponse {
    user: UserSummaryResponse;
    totalPaid: number;
    totalOwes: number;
    balance: number;
}

/** Expense summary for one shared workspace. */
export interface WorkspaceExpenseStatsResponse {
    totalAmount: number;
    balances: UserBalanceResponse[];
    recentExpenses: ExpenseResponse[];
}

/** The current user's cross-workspace expense overview and paged history. */
export interface PersonalExpenseStatsResponse {
    totalOwedToMe: number;
    totalIOwe: number;
    iOwe: DebtSummaryResponse[];
    owedToMe: DebtSummaryResponse[];
    history: ExpenseResponse[];
    historyPage: number;
    historyTotalPages: number;
    historyTotal: number;
}

/** Payload to create an expense split equally among `participantIds`. */
export interface CreateExpenseRequest {
    title: string;
    amount: number;
    workspaceId: string;
    participantIds: string[];
}
