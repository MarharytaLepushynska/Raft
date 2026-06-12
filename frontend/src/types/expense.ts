export interface UserSummaryResponse {
    id: string,
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

export interface ExpenseSplitResponse {
    id: string;
    user: UserSummaryResponse;
    share: number;
    isSettled: boolean;
}

export interface ExpenseResponse {
    id: string;
    title: string;
    amount: number;
    paidBy: UserSummaryResponse;
    splits: ExpenseSplitResponse[];
    createdAt: string;
}

export interface DebtSummaryResponse {
    user: UserSummaryResponse;
    amount: number;
    relatedExpenses: ExpenseResponse[];
}

export interface UserBalanceResponse {
    user: UserSummaryResponse;
    totalPaid: number;
    totalOwes: number;
    balance: number;
}

export interface WorkspaceExpenseStatsResponse {
    totalAmount: number;
    balances: UserBalanceResponse[];
    recentExpenses: ExpenseResponse[];
}

export interface PersonalExpenseStatsResponse {
    totalOwedToMe: number;
    totalIOwe: number;
    iOwe: DebtSummaryResponse[];
    owedToMe: DebtSummaryResponse[];
    history: ExpenseResponse[];
}

export interface CreateExpenseRequest {
    title: string;
    amount: number;
    workspaceId: string;
    participantIds: string[];
}
