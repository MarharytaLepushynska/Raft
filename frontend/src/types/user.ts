/** The logged-in user's full profile. */
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

/** Public user info (no email), used in messages, members, etc. */
export interface UserSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/** Payload for updating the current user's profile. */
export interface ProfileUpdateRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
}
