import { Icon } from '@/lib/icons.tsx';
import { useAchievements } from '@/hooks/profile/useAchievements.ts';
import '@/components/achievements/TaskAchievements.css';

const NOTE_THRESHOLDS: Record<string, number> = {
    NOTES_5: 5,
};

const ICONS = import.meta.glob<{ default: string }>('@/assets/achievements/*.png', { eager: true });

/** Maps an achievement's stored icon name to its bundled PNG. */
function iconSrc(file: string): string {
    const base = file.replace(/\.[^.]+$/, '');
    const entry = Object.entries(ICONS).find(([key]) => key.endsWith(`/${base}.png`));
    return entry ? entry[1].default : '';
}

/** Note-count achievements, showing progress toward each goal by notes created. */
export function NoteAchievements({ createdCount }: { createdCount: number }) {
    const { achievements } = useAchievements();

    const noteAchievements = achievements
        .filter((a) => a.code in NOTE_THRESHOLDS)
        .sort((a, b) => NOTE_THRESHOLDS[a.code] - NOTE_THRESHOLDS[b.code]);

    if (noteAchievements.length === 0) return null;

    return (
        <section className="todo-ach">
            <h2 className="todo-ach__title">Achievements</h2>
            <ul className="todo-ach__list">
                {noteAchievements.map((a) => {
                    const goal = NOTE_THRESHOLDS[a.code];
                    const value = Math.min(createdCount, goal);
                    return (
                        <li key={a.code} className="todo-ach__row">
                            <img className="todo-ach__icon" src={iconSrc(a.icon)} alt="" data-earned={a.earned} />
                            <div className="todo-ach__body">
                                <div className="todo-ach__head">
                                    <span className="todo-ach__name">{a.title}</span>
                                    {a.earned ? (
                                        <span className="todo-ach__check"><Icon name="check" size={14} /></span>
                                    ) : (
                                        <span className="todo-ach__count">{value}/{goal}</span>
                                    )}
                                </div>
                                {!a.earned && (
                                    <div className="todo-ach__bar">
                                        <span
                                            className="todo-ach__fill"
                                            style={{ width: `${(value / goal) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
