// Application constants
export const APP_NAME = 'Devorch Suite';
export const APP_VERSION = '1.0.0';

// Module types
export const MODULES = {
  DASHBOARD: 'dashboard',
  KANBAN: 'kanban', 
  CANVAS: 'canvas',
  CHAT: 'chat'
} as const;

// Theme colors (matching CSS custom properties)
export const THEME_COLORS = {
  PRIMARY: '#6366f1', // Indigo-500
  ACCENT: '#8b5cf6',  // Violet-500
  BACKGROUND: '#0f0f0f',
  FOREGROUND: '#fafafa'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'devorch_user_preferences',
  KANBAN_BOARDS: 'devorch_kanban_boards',
  CANVAS_PROJECTS: 'devorch_canvas_projects',
  CHAT_SESSIONS: 'devorch_chat_sessions',
  GITHUB_TOKEN: 'devorch_github_token'
} as const;

// API endpoints
export const API_ENDPOINTS = {
  GITHUB: {
    BASE: 'https://api.github.com',
    OAUTH: 'https://github.com/login/oauth'
  },
  OPENAI: {
    BASE: 'https://api.openai.com/v1'
  }
} as const;