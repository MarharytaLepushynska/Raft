export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface ProfileUpdateRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
}
