// Theme management utilities
import type { Theme } from "./types";

/**
 * Apply theme to the document
 * Adds or removes the 'dark' class on the html element
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === "system") {
    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

/**
 * Get the effective theme (resolves 'system' to actual light/dark)
 */
export function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Listen for system theme changes and apply theme accordingly
 * Returns a cleanup function to remove the listener
 */
export function watchSystemTheme(
  theme: Theme,
  onThemeChange?: (effectiveTheme: "light" | "dark") => void,
): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = () => {
    if (theme === "system") {
      applyTheme("system");
      onThemeChange?.(getEffectiveTheme("system"));
    }
  };

  mediaQuery.addEventListener("change", handler);

  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
}

/**
 * Initialize theme on page load
 * Call this in main.ts after mounting the app
 */
export async function initializeTheme(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    if (response.settings?.theme) {
      applyTheme(response.settings.theme);
      watchSystemTheme(response.settings.theme);
    }
  } catch {
    // Default to system theme if settings can't be loaded
    applyTheme("system");
    watchSystemTheme("system");
  }
}
