// Backend data
export interface User {
  email: string;
  isBeginner: boolean;
  username: string;
  following: string[];
  stats: UserStats;
  password: string;
  pfp?: string;
}

export interface UserStats {
  // TODO: Add stat fields
}

export interface AccountRegisterRequest {
  username: string;
  password: string;
  email: string;
  isBeginner: boolean;
}

export interface ImageEntry {
  id: string;
  likes: string[]; // List of usernames
}
