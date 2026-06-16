import { useAchievements } from '@/hooks/profile/useAchievements';
import { AchievementCard } from './AchievementCard';
import './AchievementsList.css';

/** Grid of all achievements with a header showing how many are earned. */
export function AchievementsList() {
    const { achievements, earned, loading } = useAchievements();

    if (loading) return <p className="wpage__muted">Loading…</p>;

    return (
        <div className="achievements">
            <h2 className="achievements__title">
                Achievements — {earned.length} earned
            </h2>

            <div className="achievements__grid">
                {achievements.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                ))}
            </div>
        </div>
    );
}
