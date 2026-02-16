import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SymbolsResponse } from "./types";

vi.mock("./storage", () => ({
  getCachedSymbols: vi.fn(),
  setCachedSymbols: vi.fn(),
}));

import { getCachedSymbols, setCachedSymbols } from "./storage";
import { fetchSymbols, getSymbols, refreshSymbols } from "./symbols";

const mockGetCachedSymbols = vi.mocked(getCachedSymbols);
const mockSetCachedSymbols = vi.mocked(setCachedSymbols);

const createResponse = (options: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: SymbolsResponse;
}): Response =>
  ({
    ok: options.ok,
    status: options.status ?? 200,
    statusText: options.statusText ?? "",
    json: async () => options.json ?? { provider: "fixer", symbols: {} },
  } as Response);

describe("symbols", () => {
  beforeEach(() => {
    mockGetCachedSymbols.mockReset();
    mockSetCachedSymbols.mockReset();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchSymbols returns symbols response", async () => {
    const response: SymbolsResponse = {
      provider: "fixer",
      symbols: { USD: "$" },
    };

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: response }),
    );

    await expect(fetchSymbols()).resolves.toEqual(response);
  });

  it("fetchSymbols returns empty symbols on 404", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: false, status: 404, statusText: "Not Found" }),
    );

    await expect(fetchSymbols()).resolves.toEqual({
      provider: "fixer",
      symbols: {},
    });
  });

  it("fetchSymbols defaults provider and symbols when missing", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: {} as SymbolsResponse }),
    );

    await expect(fetchSymbols()).resolves.toEqual({
      provider: "fixer",
      symbols: {},
    });
  });

  it("fetchSymbols throws on non-404 errors", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: false, status: 500, statusText: "Server Error" }),
    );

    await expect(fetchSymbols()).rejects.toThrow(
      "Failed to fetch symbols: Server Error",
    );
  });

  it("getSymbols returns cached symbols when available", async () => {
    mockGetCachedSymbols.mockResolvedValue({
      symbols: { EUR: "€" },
      fetchedAt: Date.now(),
    });

    await expect(getSymbols()).resolves.toEqual({ EUR: "€" });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("getSymbols fetches and caches symbols when cache missing", async () => {
    mockGetCachedSymbols.mockResolvedValue(undefined);
    const response: SymbolsResponse = {
      provider: "fixer",
      symbols: { USD: "$" },
    };

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: response }),
    );

    const symbols = await getSymbols();
    expect(symbols).toEqual({ USD: "$" });
    expect(mockSetCachedSymbols).toHaveBeenCalledTimes(1);
  });

  it("getSymbols does not cache empty symbols", async () => {
    mockGetCachedSymbols.mockResolvedValue(undefined);
    const response: SymbolsResponse = { provider: "fixer", symbols: {} };

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: response }),
    );

    const symbols = await getSymbols();
    expect(symbols).toEqual({});
    expect(mockSetCachedSymbols).not.toHaveBeenCalled();
  });

  it("refreshSymbols fetches and caches symbols", async () => {
    const response: SymbolsResponse = {
      provider: "fixer",
      symbols: { GBP: "£" },
    };

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: response }),
    );

    const symbols = await refreshSymbols();
    expect(symbols).toEqual({ GBP: "£" });
    expect(mockSetCachedSymbols).toHaveBeenCalledTimes(1);
  });

  it("refreshSymbols skips caching empty symbols", async () => {
    const response: SymbolsResponse = { provider: "fixer", symbols: {} };

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: response }),
    );

    const symbols = await refreshSymbols();
    expect(symbols).toEqual({});
    expect(mockSetCachedSymbols).not.toHaveBeenCalled();
  });

  it("uses configured API base", async () => {
    const base =
      import.meta.env.VITE_RATES_API_BASE ?? "https://apc-api.up.railway.app";

    (globalThis.fetch as Mock).mockResolvedValue(
      createResponse({ ok: true, json: {} as SymbolsResponse }),
    );

    await fetchSymbols();
    expect(globalThis.fetch).toHaveBeenCalledWith(`${base}/symbols/latest`);
  });
});
