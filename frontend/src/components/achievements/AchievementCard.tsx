import type { Achievement } from '@/types/achievement';
import greyIcon from '@/assets/achievements/grey.png';

const icons = import.meta.glob<{ default: string }>('@/assets/achievements/*.png', { eager: true });

/** Resolves the backend icon name to a bundled PNG, ignoring its stored extension (DB has .svg, assets are .png). */
function getIcon(filename: string): string {
    const base = filename.replace(/\.[a-z]+$/i, '');
    const match = Object.entries(icons).find(([key]) => key.endsWith(`${base}.png`));
    return match ? (match[1] as { default: string }).default : '';
}

interface Props {
    achievement: Achievement;
}

/** One achievement card: its colored icon when earned, a grey one when locked. */
export function AchievementCard({ achievement }: Props) {
    const iconSrc = achievement.earned ? getIcon(achievement.icon) : greyIcon;

    return (
        <div className={`achievement-card ${achievement.earned ? 'achievement-card--earned' : 'achievement-card--locked'}`}>
            <img className="achievement-card__icon" src={iconSrc} alt={achievement.title} />
            <div className="achievement-card__body">
                <p className="achievement-card__title">{achievement.title}</p>
                <p className="achievement-card__desc">{achievement.description}</p>
                {achievement.earned && achievement.earnedAt && (
                    <p className="achievement-card__date">
                        Отримано {new Date(achievement.earnedAt).toLocaleDateString('uk-UA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    </p>
                )}
            </div>
        </div>
    );
}
