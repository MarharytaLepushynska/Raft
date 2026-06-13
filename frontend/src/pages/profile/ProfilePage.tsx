import { useProfile } from '@/hooks/profile/useProfile';
import { useAchievements } from '@/hooks/profile/useAchievements';
import { formatDate } from '@/lib/notes';
import type { Achievement } from '@/types/achievement';
import './ProfilePage.css';

export function ProfilePage() {
    const { user, remove } = useProfile();
    const { earned, locked, loading: achievementsLoading } = useAchievements();

    if (!user) return null;

    const initials =
        (user.firstName[0] ?? '').toUpperCase() + (user.lastName[0] ?? '').toUpperCase();

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        await remove();
    };

    return (
        <div className="profile">
            <div className="profile-hero">
                <div className="profile-avatar">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="profile-avatar__img" />
                    ) : (
                        <div className="profile-avatar__initials">{initials}</div>
                    )}
                </div>
                <div className="profile-hero__info">
                    <h1 className="profile-hero__name">{user.firstName} {user.lastName}</h1>
                    <p className="profile-hero__username">@{user.username}</p>
                    <p className="profile-hero__email">{user.email}</p>
                </div>
            </div>

            <section className="profile-section">
                <h2 className="profile-section__title">
                    Achievements{!achievementsLoading && <> — {earned.length} earned</>}
                </h2>
                {achievementsLoading ? (
                    <p className="profile__muted">Loading…</p>
                ) : (
                    <div className="profile-achievements">
                        {earned.map((a: Achievement) => (
                            <div key={a.id} className="achievement-card achievement-card--earned">
                                <span className="achievement-card__icon">{a.icon}</span>
                                <div className="achievement-card__body">
                                    <p className="achievement-card__name">{a.name}</p>
                                    <p className="achievement-card__desc">{a.description}</p>
                                    {a.earnedAt && (
                                        <p className="achievement-card__date">Earned {formatDate(a.earnedAt)}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {locked.map((a: Achievement) => (
                            <div key={a.id} className="achievement-card achievement-card--locked">
                                <span className="achievement-card__icon">{a.icon}</span>
                                <div className="achievement-card__body">
                                    <p className="achievement-card__name">{a.name}</p>
                                    <p className="achievement-card__desc">{a.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="profile-section">
                <h2 className="profile-section__title">Account</h2>
                <div className="profile-danger">
                    <div className="profile-danger__text">
                        <p className="profile-danger__title">Delete account</p>
                        <p className="profile-danger__desc">
                            Permanently removes your account and all associated data. This cannot be undone.
                        </p>
                    </div>
                    <button type="button" className="modal__btn modal__btn--danger" onClick={handleDeleteAccount}>
                        Delete account
                    </button>
                </div>
            </section>
        </div>
    );
}