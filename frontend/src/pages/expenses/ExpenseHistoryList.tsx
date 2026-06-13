import { fmt } from '@/components/workspaceExpenses/utils/format';
import { Avatar } from '@/components/workspaceExpenses/Avatar';
import type { ExpenseResponse } from '@/types/expense';

interface Props {
    expenses: ExpenseResponse[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function ExpenseHistoryList({expenses, currentPage, totalPages, onPageChange,}: Props) {
    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
        });

    return (
        <div className="we__list-card">
            <p className="we__section-title">My expenses history</p>

            {expenses.length === 0 ? (
                <p className="we__list-empty">No expenses yet.</p>
            ) : (
                <div className="we__list">
                    {expenses.map((expense) => (
                        <div key={expense.id} className="we__list-row">
                            <Avatar
                                name={`${expense.paidBy.firstName} ${expense.paidBy.lastName}`}
                                size={28}
                            />
                            <span className="we__list-name">{expense.title}</span>
                            <span className="we__list-price--date">{fmtDate(expense.createdAt)}</span>
                            <span className="we__list-price">{fmt(expense.amount)}</span>
                        </div>
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
