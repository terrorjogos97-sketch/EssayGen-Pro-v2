
export enum AppState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  TERMS = 'TERMS',
  MAIN = 'MAIN',
  DEV_LOGIN = 'DEV_LOGIN',
  BANNED = 'BANNED',
  KEY_CENTER = 'KEY_CENTER',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface User {
  name: string;
  isDev: boolean;
  agreedToTerms: boolean;
}

export interface StoredUser {
  username: string;
  password?: string;
  email: string;
  createdAt: number;
}

export interface BanInfo {
  type: 'warning' | 'permanent';
  reason: string;
  bannedAt: number;
}

export interface EssayRequest {
  topic: string;
  type: 'essay' | 'summary' | 'creative' | 'technical';
  tone: 'formal' | 'academic' | 'casual';
  wordCount: number;
  humanize?: boolean;
}
