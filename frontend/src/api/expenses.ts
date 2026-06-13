import { api } from '@/api/http';
import type {
    ExpenseResponse,
    WorkspaceExpenseStatsResponse,
    CreateExpenseRequest,
    PersonalExpenseStatsResponse
} from "@/types/expense.ts";

export const getWorkspaceExpenses = (workspaceId: string)=>
    api.get<ExpenseResponse[]>(`/workspaces/${workspaceId}/expenses`,);

export const getWorkspaceStats = (workspaceId: string) =>
    api.get<WorkspaceExpenseStatsResponse>(`/workspaces/${workspaceId}/expenses/stats`,);

export const createExpense = (request: CreateExpenseRequest)=>
    api.post<ExpenseResponse>('/expenses', request,);

export const settleSplit = (splitId: string) =>
    api.patch(`/expenses/splits/${splitId}/settle`);

export const getPersonalStats = (params?: {
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}) => {
    const search = new URLSearchParams();

    if (params?.from) search.append("from", params.from);
    if (params?.to) search.append("to", params.to);
    if (params?.page !== undefined) search.append("page", params.page.toString());
    if (params?.size !== undefined) search.append("size", params.size.toString());

    return api.get<PersonalExpenseStatsResponse>(
        `/expenses/my?${search.toString()}`
    );
};
