// Backend data
export interface PublicUser {
  username: string;
  following: string[];
  stats: UserStats;
}

export interface PrivateUser extends PublicUser {
  email: string;
  admin: boolean;
}

export interface UserStats {
  // TODO: Add stat fields
}
