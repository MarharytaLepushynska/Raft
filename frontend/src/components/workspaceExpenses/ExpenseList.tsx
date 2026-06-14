import {fmt} from "@/components/workspaceExpenses/utils/format.ts";
import { Avatar } from './Avatar';
import type { ExpenseResponse } from '@/types/expense';

interface Props {
    expenses: ExpenseResponse[];
    selectedId: string | null;
    currentUserId: string;
    onSelect: (expense: ExpenseResponse) => void;
}

export function ExpenseList({ expenses, selectedId, currentUserId, onSelect }: Props) {
    if (expenses.length === 0) {
        return <p className="we__list-empty">No expenses yet. Add the first one!</p>;
    }

    return (
        <div className="we__list">
            {expenses.map((expense) => {
                const mySplit = expense.splits.find((s) => s.user.id === currentUserId);
                const iOwe = mySplit && !mySplit.isSettled && expense.paidBy.id !== currentUserId;

                return (
                    <button
                        key={expense.id}
                        type="button"
                        className={`we__list-row ${selectedId === expense.id ? 'we__list-row--active' : ''}`}
                        onClick={() => onSelect(expense)}
                    >

                        <Avatar name={`${expense.paidBy.firstName} ${expense.paidBy.lastName}`} src={expense.paidBy.avatar} size={28} />
                        <span className="we__list-name">{expense.title}</span>
                        <span className={`we__list-price ${iOwe ? 'we__list-price--owe' : ''}`}>
                            {fmt(expense.amount)}
                        </span>

                    </button>
                );
            })}
        </div>
    );
}
