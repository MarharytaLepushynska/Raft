interface Props {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onFilter: () => void;
}

export function ExpenseDateFilter({ from, to, onFromChange, onToChange, onFilter }: Props) {
    return (
        <div className="exp-filter">
            <label className="exp-filter__field">
                <span className="exp-filter__label">From date</span>
                <input
                    type="date"
                    className="exp-filter__input"
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                />
            </label>

            <label className="exp-filter__field">
                <span className="exp-filter__label">To date</span>
                <input
                    type="date"
                    className="exp-filter__input"
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                />
            </label>

            <button type="button" className="exp-filter__btn" onClick={onFilter}>
                Filter
            </button>

            {(from || to) && (
                <button
                    type="button"
                    className="exp-filter__clear"
                    onClick={() => {
                        onFromChange('');
                        onToChange('');
                    }}
                >
                    Clear
                </button>
            )}
        </div>
    );
}
