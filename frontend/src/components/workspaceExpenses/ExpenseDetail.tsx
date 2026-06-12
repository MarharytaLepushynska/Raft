import {fmt} from "@/components/workspaceExpenses/utils/format.ts";
import { Avatar } from './Avatar';
import type { ExpenseResponse } from '@/types/expense';

interface Props {
    expense: ExpenseResponse;
    currentUserId: string;
    onBack: () => void;
    onSettle: (splitId: string) => Promise<void>;
}

export function ExpenseDetail({ expense, currentUserId, onBack, onSettle }: Props) {
    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

    return (
        <div className="we__detail">
            <button type="button" className="we__detail-back" onClick={onBack}>
                ← Back
            </button>

            <div className="we__detail-header">
                <div>
                    <p className="we__detail-title">{expense.title}</p>
                    <p className="we__detail-amount">{fmt(expense.amount)}</p>
                </div>
                <p className="we__detail-date">{fmtDate(expense.createdAt)}</p>
            </div>

            <div className="we__detail-meta">
                <span className="we__summary-label">Paid by</span>
                <span className="we__detail-val">
                    <Avatar
                        name={`${expense.paidBy.firstName} ${expense.paidBy.lastName}`}
                        size={20}
                    />
                    {expense.paidBy.firstName} {expense.paidBy.lastName}
                </span>
            </div>

            <p className="we__section-title">Members</p>
            <div className="we__members-list">
                {expense.splits.map((split) => {
                    const isMe = split.user.id === currentUserId;
                    const canSettle = isMe && !split.isSettled && expense.paidBy.id !== currentUserId;

                    return (
                        <div key={split.id} className="we__member-row">
                            <Avatar
                                name={`${split.user.firstName} ${split.user.lastName}`}
                                size={28}
                            />
                            <div className="we__member-info">
                                <span className="we__member-name">
                                    {split.user.firstName} {split.user.lastName}
                                    {isMe && <span className="we__you-tag">you</span>}
                                </span>
                                <span className="we__member-sub">
                                  {split.isSettled ? 'Settled' : 'Pending'}
                                </span>
                            </div>
                            <span className="we__member-share">{fmt(split.share)}</span>
                            {canSettle && (
                                <button
                                    type="button"
                                    className="we-btn--settle"
                                    onClick={() => onSettle(split.id)}
                                >
                                    Settle
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
