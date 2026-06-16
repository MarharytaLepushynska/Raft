import { useProfile } from '@/hooks/profile/useProfile';
import { AchievementsList } from '@/components/achievements/AchievementsList';
import './ProfilePage.css';
import {useState} from "react";
import {EditProfileModal} from "@/pages/profile/EditProfileModal.tsx";

/** The Profile page: user details with an edit modal, achievements, and account deletion. */
export function ProfilePage() {
    const { user, remove, updateUser } = useProfile();
    const [editOpen, setEditOpen] = useState(false);

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
                <button type="button" className="modal__btn modal__btn--primary profile-hero__edit" onClick={() => setEditOpen(true)}>
                    Edit
                </button>
            </div>

            {editOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setEditOpen(false)}
                    onSave={(updated) => updateUser(updated)}
                />
            )}

            <AchievementsList />

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
