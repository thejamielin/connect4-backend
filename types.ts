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

export interface PictureData {
  id: string;
  likes: string[]; // List of usernames
}

// interpretation of a single image Pixbay API response
export interface ApiEntry {
  id: number;
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
  hits: ApiEntry[];
}
