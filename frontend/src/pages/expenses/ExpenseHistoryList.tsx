import { fmt } from '@/components/workspaceExpenses/utils/format';
import { Avatar } from '@/components/workspaceExpenses/Avatar';
import type { ExpenseResponse } from '@/types/expense';
import {ExpenseDetail} from "@/components/workspaceExpenses/ExpenseDetail.tsx";
import {useState} from "react";

interface Props {
    expenses: ExpenseResponse[];
    currentUserId: string;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSettle: (splitId: string) => Promise<void>;
}

/** Paged list of my past expenses, drilling into one with `ExpenseDetail` on click. */
export function ExpenseHistoryList({expenses, currentUserId, currentPage, totalPages, onPageChange, onSettle,}: Props) {
    const [selected, setSelected] = useState<ExpenseResponse | null>(null);

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
        });

    if (selected) {
        return (
            <div className="we__list-card">
                <ExpenseDetail
                    expense={selected}
                    currentUserId={currentUserId}
                    onBack={() => setSelected(null)}
                    onSettle={onSettle}
                />
            </div>
        );
    }

    return (
        <div className="we__list-card">
            <p className="we__list-label">My expenses history</p>

            {expenses.length === 0 ? (
                <p className="we__list-empty">No expenses yet.</p>
            ) : (
                <div className="we__list">
                    {expenses.map((expense) => (
                        <button
                            key={expense.id}
                            type="button"
                            className="we__list-row"
                            onClick={() => setSelected(expense)}
                        >
                            <Avatar
                                name={`${expense.paidBy.firstName} ${expense.paidBy.lastName}`}
                                src={expense.paidBy.avatar}
                                size={28}
                            />
                            <span className="we__list-name">{expense.title}</span>
                            <span className="we__list-price--date">{fmtDate(expense.createdAt)}</span>
                            <span className="we__list-price">{fmt(expense.amount)}</span>
                        </button>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="exp-pagination">
                    <button
                        type="button"
                        className="exp-pagination__btn"
                        disabled={currentPage === 0}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        ←
                    </button>
                    <span className="exp-pagination__info">
                        {currentPage + 1} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className="exp-pagination__btn"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
