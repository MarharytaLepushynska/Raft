import type {WorkspaceExpenseStatsResponse} from "@/types/expense.ts";
import {fmt} from "@/components/workspaceExpenses/utils/format.ts";
interface Props {
    stats: WorkspaceExpenseStatsResponse;
    currentUserId: string;
}

/** Header summary of a workspace's expenses: the total and the current user's balance. */
export function ExpenseSummary({ stats, currentUserId }: Props) {
    const myBalance = stats.balances.find((b) => b.user.id === currentUserId);

    return (
        <div className="we__summary">
            <div className="we__summary-item">
                <span className="we__summary-label" title="Total spent">Total spent</span>
                <span className="we__summary-value" title={fmt(stats.totalAmount)}>{fmt(stats.totalAmount)}</span>
            </div>

            {myBalance && (
                <div className={`we__summary-item ${myBalance.balance < 0 ? 'we__summary-item--owe' : ''}`}>
                    <span className="we__summary-label" title={myBalance.balance >= 0 ? 'Owed to me' : 'I owe'}>
                        {myBalance.balance >= 0 ? 'Owed to me' : 'I owe'}
                    </span>
                    <span className="we__summary-value" title={fmt(Math.abs(myBalance.balance))}>
                        {fmt(Math.abs(myBalance.balance))}
                    </span>
                </div>
            )}

            <div className="we__summary-item">
                <span className="we__summary-label" title="Transactions">Transactions</span>
                <span className="we__summary-value" title="stats.recentExpenses.length">{stats.recentExpenses.length}</span>
            </div>
        </div>
    );
}
