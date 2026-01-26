// Messaging utilities for Chrome extension

import type { Message } from "./types";

export async function sendMessageToBackground<T>(message: Message): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

export async function sendMessageToTab<T>(
  tabId: number,
  message: Message,
): Promise<T> {
  return chrome.tabs.sendMessage(tabId, message);
}

export async function sendMessageToActiveTab<T>(message: Message): Promise<T> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found");
  }
  return chrome.tabs.sendMessage(tab.id, message);
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
