// Backend data
export interface User {
  email: string;
  beginner: boolean;
  username: string;
  following: string[];
  stats: UserStats;
  password: string;
  pfp?: string;
}

export interface UserStats {
  // TODO: Add stat fields
}

export interface ImageEntry {
  id: string;
  likes: string[] // List of usernames
}
