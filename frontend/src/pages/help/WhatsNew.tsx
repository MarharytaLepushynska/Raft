const UPDATES = [
    {
        date: '16 June 2026',
        text: 'Added achievements — earn rewards for creating notes, completing tasks, and settling debts!',
    },
    {
        date: '15 June 2026',
        text: 'New way to express yourself in workspaces — added member chats.',
    },
    {
        date: '13 June 2026',
        text: 'Added pin board — pin images or notes for quick access!',
    },
    {
        date: '9 June 2026',
        text: 'New themes and accent colors — customise your app appearance.',
    },
    {
        date: '5 June 2026',
        text: 'Shared expenses now support settling debts directly from the list.',
    },
    {
        date: '1 June 2026',
        text: 'You can now create shared folders — perfect for team collaboration.',
    },
    {
        date: '28 May 2026',
        text: 'Task filters by priority and status to help you focus.',
    },
];

/** Sidebar block listing recent app updates, newest first. */
export function WhatsNew() {
    return (
        <div className="help-sidebar-block">
            <h3 className="help-sidebar__title">What's new</h3>
            <ul className="whatsnew-list">
                {UPDATES.map((item) => (
                    <li key={item.date} className="whatsnew-item">
                        <span className="whatsnew-date">{item.date}</span>
                        <p className="whatsnew-text">{item.text}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}