import { useEffect, useState } from 'react';
import { searchUsers } from '@/api/user';
import type { User } from '@/types/user';

/** Searches users matching `query` (debounced 200ms) and returns the matches for an autocomplete. */
export function useUserSuggestions(query: string): User[] {
  const [suggestions, setSuggestions] = useState<User[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      searchUsers(q)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return suggestions;
}
