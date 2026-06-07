import type { Note } from '@/types/note';
import { mockFolders } from './folders';

const mockUser = { id: 'u-1', firstName: 'Mia', lastName: 'Carter', email: 'mia.carter@gmail.com' };

export const mockNotes: Note[] = [
    {
        id: 'n-1',
        folder: mockFolders[0],
        creator: mockUser,
        title: 'Project idea',
        content: 'Build a note-taking app with tags and search',
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
    },
    {
        id: 'n-2',
        folder: mockFolders[1],
        creator: mockUser,
        title: 'Sprint planning',
        content: 'Finish notes API, write unit tests, update docs',
        createdAt: '2026-06-02T09:30:00Z',
        updatedAt: '2026-06-03T14:20:00Z',
    },
];