import { useEffect, useState } from 'react';
import { getAchievements } from '@/api/achievements';
import type { Achievement } from '@/types/achievement';

/** Loads all achievements and splits them into `earned` and `locked` lists. */
export function useAchievements() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getAchievements()
            .then((data) => { if (active) setAchievements(data); })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const earned = achievements.filter((a) => a.earned);
    const locked = achievements.filter((a) => !a.earned);

    return { achievements, earned, locked, loading };
}