// Backend data
export interface User {
  email: string;
  admin: boolean;
  username: string;
  following: string[];
  stats: UserStats;
  password: string;
}

export interface UserStats {
  // TODO: Add stat fields
}
