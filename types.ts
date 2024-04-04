// Backend data
export interface User {
  email: string;
  beginner: boolean;
  username: string;
  following: string[];
  stats: UserStats;
  password: string;
}

export interface UserStats {
  // TODO: Add stat fields
}
