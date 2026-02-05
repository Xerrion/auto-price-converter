// Tests for settings import/export utilities

import { describe, it, expect } from "vitest";
import {
  createExportData,
  validateImportedSettings,
  parseSettingsFile,
  getExportVersion,
  SettingsImportError,
} from "./settings-io";
import type { Settings } from "./types";

const validSettings: Settings = {
  enabled: true,
  targetCurrency: "EUR",
  showOriginalPrice: true,
  highlightConverted: true,
  decimalPlaces: 2,
  numberFormat: "en-US",
  theme: "system",
  exclusionList: [],
};

describe("createExportData", () => {
  it("creates valid export structure", () => {
    const result = createExportData(validSettings);

    expect(result.version).toBe(1);
    expect(result.exportedAt).toBeDefined();
    expect(result.settings).toEqual(validSettings);
  });

  it("includes current timestamp", () => {
    const before = new Date().toISOString();
    const result = createExportData(validSettings);
    const after = new Date().toISOString();

    expect(result.exportedAt >= before).toBe(true);
    expect(result.exportedAt <= after).toBe(true);
  });

  it("preserves exclusion list", () => {
    const settingsWithExclusions: Settings = {
      ...validSettings,
      exclusionList: [
        {
          id: "test-1",
          pattern: "example.com",
          type: "domain",
          addedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };

    const result = createExportData(settingsWithExclusions);
    expect(result.settings.exclusionList).toHaveLength(1);
    expect(result.settings.exclusionList[0].pattern).toBe("example.com");
  });
});

describe("getExportVersion", () => {
  it("returns current version", () => {
    expect(getExportVersion()).toBe(1);
  });
});

describe("validateImportedSettings", () => {
  it("accepts valid exported settings", () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: validSettings,
    };

    const result = validateImportedSettings(exportData);

    expect(result.version).toBe(1);
    expect(result.settings.targetCurrency).toBe("EUR");
  });

  it("normalizes partial settings with defaults", () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: {
        targetCurrency: "USD",
        // missing other fields
      },
    };

    const result = validateImportedSettings(exportData);

    expect(result.settings.targetCurrency).toBe("USD");
    expect(result.settings.enabled).toBe(true); // default
    expect(result.settings.decimalPlaces).toBe(2); // default
  });

  it("rejects null data", () => {
    expect(() => validateImportedSettings(null)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings(null)).toThrow(
      "Invalid file format",
    );
  });

  it("rejects non-object data", () => {
    expect(() => validateImportedSettings("string")).toThrow(
      SettingsImportError,
    );
    expect(() => validateImportedSettings(123)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings([])).toThrow(SettingsImportError);
  });

  it("rejects missing version", () => {
    const data = {
      exportedAt: "2026-01-01T00:00:00Z",
      settings: validSettings,
    };

    expect(() => validateImportedSettings(data)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings(data)).toThrow("Missing version");
  });

  it("rejects future version", () => {
    const data = {
      version: 999,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: validSettings,
    };

    expect(() => validateImportedSettings(data)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings(data)).toThrow("newer version");
  });

  it("rejects missing exportedAt", () => {
    const data = {
      version: 1,
      settings: validSettings,
    };

    expect(() => validateImportedSettings(data)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings(data)).toThrow("export timestamp");
  });

  it("rejects missing settings", () => {
    const data = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
    };

    expect(() => validateImportedSettings(data)).toThrow(SettingsImportError);
    expect(() => validateImportedSettings(data)).toThrow(
      "Settings data is missing",
    );
  });

  it("rejects null settings", () => {
    const data = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: null,
    };

    expect(() => validateImportedSettings(data)).toThrow(SettingsImportError);
  });

  it("validates and filters invalid exclusion entries", () => {
    const data = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: {
        ...validSettings,
        exclusionList: [
          // Valid entry
          {
            id: "valid",
            pattern: "example.com",
            type: "domain",
            addedAt: "2026-01-01T00:00:00Z",
          },
          // Invalid entry (missing pattern)
          { id: "invalid", type: "domain", addedAt: "2026-01-01T00:00:00Z" },
          // Invalid entry (wrong type)
          {
            id: "invalid2",
            pattern: "test.com",
            type: "invalid-type",
            addedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    };

    const result = validateImportedSettings(data);

    // Only the valid entry should remain
    expect(result.settings.exclusionList).toHaveLength(1);
    expect(result.settings.exclusionList[0].id).toBe("valid");
  });
});

describe("parseSettingsFile", () => {
  function createMockFile(
    content: string,
    name: string = "settings.json",
    type: string = "application/json",
  ): File {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  }

  it("parses valid JSON file", async () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: validSettings,
    };
    const file = createMockFile(JSON.stringify(exportData));

    const result = await parseSettingsFile(file);

    expect(result.version).toBe(1);
    expect(result.settings.targetCurrency).toBe("EUR");
  });

  it("rejects non-JSON file extension", async () => {
    const file = createMockFile("{}", "settings.txt", "text/plain");

    await expect(parseSettingsFile(file)).rejects.toThrow(SettingsImportError);
    await expect(parseSettingsFile(file)).rejects.toThrow("JSON file");
  });

  it("accepts .json extension regardless of mime type", async () => {
    const exportData = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      settings: validSettings,
    };
    const file = createMockFile(
      JSON.stringify(exportData),
      "settings.json",
      "text/plain",
    );

    const result = await parseSettingsFile(file);
    expect(result.version).toBe(1);
  });

  it("rejects invalid JSON content", async () => {
    const file = createMockFile("not valid json {{{", "settings.json");

    await expect(parseSettingsFile(file)).rejects.toThrow(SettingsImportError);
    await expect(parseSettingsFile(file)).rejects.toThrow("valid JSON");
  });

  it("rejects valid JSON with invalid structure", async () => {
    const file = createMockFile(
      JSON.stringify({ foo: "bar" }),
      "settings.json",
    );

    await expect(parseSettingsFile(file)).rejects.toThrow(SettingsImportError);
  });
});
