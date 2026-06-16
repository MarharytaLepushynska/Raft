import { useEffect, useState } from 'react';
import { getWorkspaces } from '@/api/workspaces';
import { colorHex } from '@/lib/workspaceColors';
import type { Workspace } from '@/types/workspace';

/** Loads the user's workspaces, plus `spaceOptions` already shaped for the space filter dropdowns. */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    getWorkspaces().then(setWorkspaces);
  }, []);

  const spaceOptions = workspaces.map((w) => ({ id: w.id, label: w.name, color: colorHex(w.color) }));

  return { workspaces, spaceOptions };
}
