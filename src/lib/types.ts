// Shared types for the Chrome extension

export interface Settings {
  enabled: boolean;
  theme: "light" | "dark" | "auto";
  notifications: boolean;
}

export interface Message {
  type: string;
  payload?: unknown;
}

export interface TabInfo {
  tabId: number;
  url: string;
}

export interface PageInfo {
  title: string;
  url: string;
  domain: string;
}
