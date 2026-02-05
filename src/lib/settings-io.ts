// Settings import/export utilities
// Handles exporting settings to JSON file and importing from file

import type { Settings } from "./types";
import { normalizeSettings } from "./storage";

/** Current export format version */
const EXPORT_VERSION = 1;

/** Exported settings file structure */
export interface ExportedSettings {
  version: number;
  exportedAt: string;
  settings: Settings;
}

/** Export validation error */
export class SettingsImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsImportError";
  }
}

/**
 * Export settings to a JSON file and trigger download
 *
 * @param settings - The current settings to export
 */
export function exportSettings(settings: Settings): void {
  const exportData: ExportedSettings = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "price-converter-settings.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Create export data object (useful for testing)
 *
 * @param settings - The settings to export
 * @returns The export data object
 */
export function createExportData(settings: Settings): ExportedSettings {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
  };
}

/**
 * Validate imported settings data
 *
 * @param data - The parsed JSON data
 * @returns Validated ExportedSettings
 * @throws SettingsImportError if validation fails
 */
export function validateImportedSettings(data: unknown): ExportedSettings {
  // Check basic structure
  if (typeof data !== "object" || data === null) {
    throw new SettingsImportError(
      "Invalid file format. Please select a valid settings file.",
    );
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (typeof obj.version !== "number") {
    throw new SettingsImportError(
      "Invalid settings file. Missing version information.",
    );
  }

  if (obj.version > EXPORT_VERSION) {
    throw new SettingsImportError(
      "This settings file is from a newer version and cannot be imported.",
    );
  }

  // Check exportedAt
  if (typeof obj.exportedAt !== "string") {
    throw new SettingsImportError(
      "Invalid settings file. Missing export timestamp.",
    );
  }

  // Check settings object exists
  if (typeof obj.settings !== "object" || obj.settings === null) {
    throw new SettingsImportError(
      "Invalid settings file. Settings data is missing.",
    );
  }

  // Normalize settings (this fills in defaults for missing fields and validates values)
  const normalizedSettings = normalizeSettings(
    obj.settings as Partial<Settings>,
  );

  return {
    version: obj.version,
    exportedAt: obj.exportedAt,
    settings: normalizedSettings,
  };
}

/**
 * Parse a settings file and return validated settings
 *
 * @param file - The file to parse
 * @returns Promise resolving to validated ExportedSettings
 * @throws SettingsImportError if parsing or validation fails
 */
export async function parseSettingsFile(file: File): Promise<ExportedSettings> {
  // Check file type
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    throw new SettingsImportError("Please select a JSON file.");
  }

  // Read file contents using FileReader for better compatibility
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new SettingsImportError("Failed to read file."));
    reader.readAsText(file);
  });

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new SettingsImportError(
      "Invalid file format. The file does not contain valid JSON.",
    );
  }

  // Validate and return
  return validateImportedSettings(data);
}

/**
 * Get the current export format version
 */
export function getExportVersion(): number {
  return EXPORT_VERSION;
}
