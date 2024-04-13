// Backend data

export type User = RegularUser | BeginnerUser;

export interface RegularUser {
  email: string;
  role: "regular";
  username: string;
  following: string[];
  stats: UserStats;
  password: string;
  pfp?: string;
}

export interface BeginnerUser {
  email: string;
  role: "beginner";
  username: string;
  password: string;
}

export interface UserStats {
  wins: number;
  losses: number;
  ties: number;
  gameIDs: string[];
}

export interface AccountRegisterRequest {
  username: string;
  password: string;
  email: string;
  isBeginner: boolean;
}

export interface PictureStats {
  id: string;
  likes: string[]; // List of usernames
}

// interpretation of a single image Pixbay API response
export interface PictureInfo {
  id: number;
  pageURL: string;
  previewURL: string;
  webformatURL: string;
  views: number;
  downloads: number;
  user: string;
  tags: string;
  likes: string[];
}

export interface ApiResult {
  total: number;
  totalHits: number;
  hits: PictureInfo[];
}
