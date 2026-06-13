import { useState } from 'react';
import { deleteUser } from '@/api/user';
import { useAuth } from '@/auth/AuthContext';

export function useProfile() {
    const { user, logout } = useAuth();
    const [saving] = useState(false);
    const [error] = useState<string | null>(null);

    const remove = async (): Promise<void> => {
        await deleteUser();
        logout();
    };

    return { user, saving, error, remove };
}