import type { Folder } from '@/types/folder';
import type {User} from "@/types/user.ts";

const mockUser: User = {
    id: 'u-001',
    firstName: 'Mia',
    lastName: 'Carter',
    email: 'mia.carter@gmail.com',
};

export const mockFolders: Folder[] = [
    {
        id: 'f-1',
        name: 'Personal',
        type: 'PERSONAL',
        owner: mockUser,
        created: '2026-01-01T00:00:00Z',
    },
    {
        id: 'f-2',
        name: 'Work',
        type: 'SHARED',
        owner: mockUser,
        created: '2026-02-15T10:30:00Z',
    },
    {
        id: 'f-3',
        name: 'Ideas',
        type: 'PERSONAL',
        owner: mockUser,
        created: '2026-03-10T14:20:00Z',
    },
    {
        id: 'f-4',
        name: 'Archive',
        type: 'SHARED',
        owner: { id: 'u-3', firstName: 'Sophia', lastName: 'Chen', email: 'sophia.chen@company.com' },
        created: '2026-04-05T09:00:00Z',
    },
];