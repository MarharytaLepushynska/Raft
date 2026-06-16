import { useEffect, useState } from 'react';
import {
    getWorkspaceExpenses,
    getWorkspaceStats,
    createExpense,
    settleSplit,
} from '@/api/expenses';
import type { ExpenseResponse, WorkspaceExpenseStatsResponse } from '@/types/expense';
import type { Member } from '@/types/workspace';
import { useAuth } from '@/auth/AuthContext';

import { ExpenseSummary } from './ExpenseSummary';
import { ExpenseList } from './ExpenseList';
import { ExpenseDetail } from './ExpenseDetail';
import { AddExpenseModal } from './AddExpenseModal';
import './WorkspaceExpenses.css';

interface Props {
    workspaceId: string;
    members: Member[];
}

/** The expenses tab of a shared workspace: balances summary, expense list/detail, and adding new ones. */
export function WorkspaceExpenses({workspaceId, members}: Props) {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
    const [stats, setStats] = useState<WorkspaceExpenseStatsResponse | null>(null);
    const [selected, setSelected] = useState<ExpenseResponse | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            let active = true;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(true);

            Promise.all([
                getWorkspaceExpenses(workspaceId),
                getWorkspaceStats(workspaceId),
            ])
                .then(([expensesData, statsData]) => {
                    if (!active) return;
                    setExpenses(expensesData);
                    setStats(statsData);
                })
                .finally(() => {
                    if (active) setLoading(false);
                });

            return () => { active = false; };
            }, [workspaceId]
    );

    const handleAdd = async (request: Parameters<typeof createExpense>[0]) => {
        const newExpense = await createExpense(request);
        setExpenses((prev) => [newExpense, ...prev]);
        getWorkspaceStats(workspaceId).then(setStats);
    };

    const handleSettle = async (splitId: string) => {
        await settleSplit(splitId);

        setExpenses((prev) =>
            prev.map((e) => ({
                ...e,
                splits: e.splits.map((s) =>
                    s.id === splitId ? { ...s, isSettled: true } : s,
                ),
            })),
        );

        setSelected((prev) =>
            prev
                ? {
                    ...prev,
                    splits: prev.splits.map((s) =>
                        s.id === splitId ? { ...s, isSettled: true } : s,
                    ),
                }
                : null,
        );

        getWorkspaceStats(workspaceId).then(setStats);
    };

    if (loading) return <p className="wpage__muted">Loading…</p>;

    return (
        <div className="we">
            <div className="we__header">
                <h2 className="wpage__subtitle">Expenses</h2>
                <button
                    type="button"
                    className="wpage__add"
                    onClick={() => setAddOpen(true)}
                >
                    Add expense
                </button>
            </div>

            {stats && <ExpenseSummary stats={stats} currentUserId={user?.id ?? ''} />}

            <div className="we__list-card">
                {selected ? (
                    <ExpenseDetail
                        expense={selected}
                        currentUserId={user?.id ?? ''}
                        onBack={() => setSelected(null)}
                        onSettle={handleSettle}
                    />
                ) : (
                    <>
                        <p className="we__section-title">Team expenses</p>
                        <ExpenseList
                            expenses={expenses}
                            selectedId={null}
                            currentUserId={user?.id ?? ''}
                            onSelect={setSelected}
                        />
                    </>
                )}
            </div>

            {addOpen && (
                <AddExpenseModal
                    workspaceId={workspaceId}
                    members={members}
                    onClose={() => setAddOpen(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}
