import { useState } from 'react';
import { deleteUser } from '@/api/user';
import { useAuth } from '@/auth/AuthContext';

/** Gives the current user (from auth) and actions to update the profile or delete the account. */
export function useProfile() {
    const { user, logout, updateUser } = useAuth();
    const [saving] = useState(false);
    const [error] = useState<string | null>(null);

    const remove = async (): Promise<void> => {
        await deleteUser();
        logout();
    };

    return { user, saving, error, remove, updateUser };
}
