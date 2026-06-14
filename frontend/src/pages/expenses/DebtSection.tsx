import { fmt } from "@/components/workspaceExpenses/utils/format.ts";
import { Avatar } from '@/components/workspaceExpenses/Avatar.tsx';
import type { DebtSummaryResponse } from '@/types/expense.ts';

interface Props {
    title: string;
    amount: number;
    debts: DebtSummaryResponse[];
    canSettle?: boolean;
    onSettle?: (splitId: string) => Promise<void>;
}

export function DebtSection({ title, amount, debts, canSettle, onSettle }: Props) {
    return (
        <div className="we__list-card exp-debt">
            <div className="exp-debt__header">
                <p className="exp-debt__title">{title}</p>
                <p className="exp-debt__amount">{fmt(amount)}</p>
            </div>

            <p className="we__section-title">People</p>

            {debts.length === 0 ? (
                <p className="we__list-empty">All settled!</p>
            ) : (
                <div className="we__list">
                    {debts.map((debt) => (
                        <div key={debt.user.id} className="exp-debt__person">
                            <div className="we__member-row">
                                <Avatar
                                    name={`${debt.user.firstName} ${debt.user.lastName}`}
                                    src={debt.user.avatar}
                                    size={28}
                                />
                                <div className="we__member-info">
                                    <span className="we__member-name">
                                        {debt.user.firstName} {debt.user.lastName}
                                    </span>
                                    <span className="we__member-sub">
                                        {debt.relatedExpenses.length} expense
                                        {debt.relatedExpenses.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <span className="we__member-share">{fmt(debt.amount)}</span>
                            </div>

                            {canSettle && onSettle && debt.relatedExpenses.map((expense) => {
                                const mySplit = expense.splits.find(
                                    (s) => !s.isSettled
                                );
                                if (!mySplit) return null;

                                return (
                                    <div key={expense.id} className="exp-debt__expense-row">
                                        <span className="exp-debt__expense-title">{expense.title}</span>
                                        <span className="exp-debt__expense-amount">
                                            {fmt(mySplit.share)}
                                        </span>
                                        <button
                                            type="button"
                                            className="we-btn--settle"
                                            onClick={() => onSettle(mySplit.id)}
                                        >
                                            Settle
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
