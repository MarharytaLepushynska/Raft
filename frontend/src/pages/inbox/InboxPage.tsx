import { useMemo, useState } from 'react';
import { useNotifications } from '@/hooks/inbox/useNotifications';
import { useReminders } from '@/hooks/inbox/useReminders';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Icon } from '@/lib/icons';
import { NotificationRow } from '@/components/inbox/NotificationRow';
import { ReminderRow } from '@/components/inbox/ReminderRow';
import { EmptyState } from '@/components/inbox/EmptyState';
import { SingleSelectFilter } from '@/components/common/SingleSelectFilter';
import './InboxPage.css';

type Tab = 'all' | 'unread' | 'read';
type ReminderTab = 'all' | 'sent' | 'overdue';
type SortKey = 'date' | 'type';

export function InboxPage() {
    const { notifications, unreadCount, loading: nLoading, markOne, markAll, remove: removeNotif } = useNotifications();
    const { reminders, loading: rLoading, remove: removeReminder } = useReminders();

    const [tab, setTab] = useState<Tab>('all');
    const [reminderTab, setReminderTab] = useState<ReminderTab>('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('date');
    const [showReminders, setShowReminders] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; kind: 'notif' | 'reminder' } | null>(null);

    const loading = nLoading || rLoading;

    const filteredNotifications = useMemo(() => {
        let list = notifications;
        if (tab === 'unread') list = list.filter(n => !n.read);
        if (tab === 'read') list = list.filter(n => n.read);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
        }
        if (sort === 'type') {
            list = [...list].sort((a, b) => a.type.localeCompare(b.type));
        }
        return list;
    }, [notifications, tab, search, sort]);

    const filteredReminders = useMemo(() => {
        let list = reminders;
        if (reminderTab === 'sent') list = list.filter(r => r.sent);
        if (reminderTab === 'overdue') list = list.filter(r => !r.sent && new Date(r.reminderTime) < new Date());
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(r =>
                (r.taskId && r.taskId.toLowerCase().includes(q)) ||
                (r.eventId && r.eventId.toLowerCase().includes(q))
            );
        }
        return list;
    }, [reminders, reminderTab, search]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.kind === 'notif') removeNotif(deleteTarget.id);
        else removeReminder(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <div className="inbox">
            <div className="inbox__header">
                <div className="inbox__heading-row">
                    <div>
                        <h1 className="inbox__title">Notifications</h1>
                        <p className="inbox__subtitle">
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                                : 'All caught up'}
                        </p>
                    </div>

                    <div className="inbox__header-actions">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="inbox__mark-all"
                                onClick={markAll}
                                title="Mark all as read"
                            >
                                <Icon name="check" size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                <div className="inbox__toolbar">
                    <div className="inbox__search">
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            placeholder="Search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {showReminders ? (
                        <div className="inbox-chips">
                            {(['all', 'sent', 'overdue'] as ReminderTab[]).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className="inbox-chip"
                                    data-active={reminderTab === t}
                                    onClick={() => setReminderTab(t)}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="inbox-chips">
                            {(['all', 'unread', 'read'] as Tab[]).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className="inbox-chip"
                                    data-active={tab === t}
                                    onClick={() => setTab(t)}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="inbox-chips">
                        <button
                            type="button"
                            className="inbox-chip"
                            data-active={!showReminders}
                            onClick={() => setShowReminders(false)}
                        >
                            Notifications
                        </button>
                        <button
                            type="button"
                            className="inbox-chip"
                            data-active={showReminders}
                            onClick={() => setShowReminders(true)}
                        >
                            Reminders
                        </button>
                    </div>

                    <SingleSelectFilter
                        options={[
                            { id: 'date', label: 'By date' },
                            { id: 'type', label: 'By type' },
                        ]}
                        value={sort}
                        onChange={id => setSort(id as SortKey)}
                    />
                </div>
            </div>

            <div className="inbox__list">
                {loading ? (
                    <EmptyState label="Loading..." />
                ) : showReminders ? (
                    filteredReminders.length === 0 ? (
                        <EmptyState label="No reminders yet." />
                    ) : (
                        filteredReminders.map(r => (
                            <ReminderRow
                                key={r.id}
                                reminder={r}
                                onDelete={id => setDeleteTarget({ id, kind: 'reminder' })}
                            />
                        ))
                    )
                ) : filteredNotifications.length === 0 ? (
                    <EmptyState label={tab === 'unread' ? 'No unread notifications.' : 'Nothing here yet.'} />
                ) : (
                    filteredNotifications.map(n => (
                        <NotificationRow
                            key={n.id}
                            notification={n}
                            onRead={markOne}
                            onDelete={id => setDeleteTarget({ id, kind: 'notif' })}
                        />
                    ))
                )}
            </div>

            {deleteTarget && (
                <ConfirmModal
                    title="Delete?"
                    text={`This ${deleteTarget.kind === 'notif' ? 'notification' : 'reminder'} will be permanently removed.`}
                    confirmLabel="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}