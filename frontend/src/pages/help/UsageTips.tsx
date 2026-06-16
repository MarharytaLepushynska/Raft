import { Icon } from '@/lib/icons';

const TIPS = [
    'Use workspace chats to share your thoughts with team members.',
    'Set reminders for tasks to stay on top of deadlines.',
    'Pin important notes to your dashboard for instant access.',
    'Create shared folders to collaborate seamlessly with your team.',
    'Filter tasks by priority to focus on what truly matters.',
    'Mark expenses as settled directly from the debt list – no extra clicks.',
    'Customise your app with accent colors and dark/light theme in Settings.',
    'Earn achievements by creating notes, completing tasks, and settling debts.',
    'Track shared expenses per workspace – perfect for trips or household bills.',
    'Add images to your pinboard for visual reminders or inspiration.',
];

export function UsageTips() {
    return (
        <div className="help-sidebar-block">
            <h3 className="help-sidebar__title">Usage tips</h3>
            <ul className="tips-list">
                {TIPS.map((tip, idx) => (
                    <li key={idx} className="tip-item">
                        <Icon name="tip" className="tip-icon"></Icon>
                        <span className="tip-text">{tip}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}