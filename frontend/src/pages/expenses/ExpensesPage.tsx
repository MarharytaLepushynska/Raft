import {getPersonalStats, settleSplit} from "@/api/expenses.ts";
import type { PersonalExpenseStatsResponse } from '@/types/expense';
import '@/components/workspaceExpenses/WorkspaceExpenses.css';
import './ExpensesPage.css';
import {DebtSection} from "@/pages/expenses/DebtSection.tsx";
import {ExpenseHistoryList} from "@/pages/expenses/ExpenseHistoryList.tsx";
import {PersonalExpenseSummary} from "@/pages/expenses/PersonalExpenseSummary.tsx";
import {useEffect, useState} from "react";
import { useAuth } from '@/auth/AuthContext';

export function ExpensesPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<PersonalExpenseStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        getPersonalStats({ from: from || undefined, to: to || undefined, page, size: 5 })
            .then((data) => { if (active) setStats(data); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [from, to, page]);

    const handleFilter = () => setPage(0);

    const handleFromChange = (value: string) => {
        setFrom(value);
        setPage(0);
    }

    const handleToChange = (value: string) => {
        setTo(value);
        setPage(0);
    };

    const handleSettle = async (splitId: string) => {
        await settleSplit(splitId);
        getPersonalStats({
            from: from || undefined,
            to: to || undefined,
            page,
            size: 5,
        }).then(setStats);
    };

    if (loading) return <p className="wpage__muted">Loading…</p>;

    return (
        <div className="exp-page">

            <PersonalExpenseSummary
                totalOwedToMe={stats?.totalOwedToMe ?? 0}
                totalIOwe={stats?.totalIOwe ?? 0}
                from={from}
                to={to}
                onFromChange={handleFromChange}
                onToChange={handleToChange}
                onFilter={handleFilter}
            />

            <div className="exp-page__columns">
                <div className="exp-page__left">
                    <DebtSection
                        title="Owed to me"
                        amount={stats?.totalOwedToMe ?? 0}
                        debts={stats?.owedToMe ?? []}
                    />
                    <DebtSection
                        title="Owed by me"
                        amount={stats?.totalIOwe ?? 0}
                        debts={stats?.iOwe ?? []}
                        canSettle
                        onSettle={handleSettle}
                    />
                </div>

                <ExpenseHistoryList
                    expenses={stats?.history ?? []}
                    currentUserId={user?.id ?? ''}
                    currentPage={page}
                    totalPages={stats?.historyTotalPages ?? 0}
                    onPageChange={setPage}
                    onSettle={handleSettle}
                />
            </div>
        </div>
    );
}
