import { fmt } from "@/components/workspaceExpenses/utils/format.ts";
import {ExpenseDateFilter} from "@/pages/expenses/ExpenseDateFilter.tsx";

interface Props {
    totalOwedToMe: number;
    totalIOwe: number;
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onFilter: () => void;
}

/** Header of the Expenses page: the date filter and a net balance banner. */
export function PersonalExpenseSummary({totalOwedToMe, totalIOwe,
                                           from, to,
                                           onFromChange, onToChange, onFilter,}: Props) {
    const net = totalOwedToMe - totalIOwe;

    return(
        <div className="exp-summary">
            <div className="exp-summary__top">
                <h2 className="exp-summary__heading">Your expense statistics</h2>
                <ExpenseDateFilter
                    from={from}
                    to={to}
                    onFromChange={onFromChange}
                    onToChange={onToChange}
                    onFilter={onFilter}
                />
            </div>

            <div className="exp-summary__banner">
                <span className="exp-summary__banner-label">Your Balance</span>
                <span className={`exp-summary__banner-value ${net < 0 ? 'exp-summary__banner-value--owe' : ''}`}>
          {fmt(net)}
        </span>
            </div>
        </div>
    );
}
