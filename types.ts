// FIX: Added AppState enum, which is used in StatusDisplay.tsx but was missing.
export enum AppState {
  IDLE,
  INITIALIZING,
  ANALYZING,
  GENERATING,
  SPEAKING,
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
