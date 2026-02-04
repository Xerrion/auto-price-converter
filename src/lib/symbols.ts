import type { SymbolsResponse } from "./types";
import { getCachedSymbols, setCachedSymbols } from "./storage";

const API_BASE_URL =
  import.meta.env.VITE_RATES_API_BASE ?? "https://api.your-backend.example";

export async function fetchSymbols(): Promise<SymbolsResponse> {
  const url = `${API_BASE_URL}/symbols/latest`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return { provider: "fixer", symbols: {} };
    }
    throw new Error(`Failed to fetch symbols: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    provider: data.provider ?? "fixer",
    symbols: data.symbols ?? {},
  };
}

export async function getSymbols(): Promise<Record<string, string>> {
  const cached = await getCachedSymbols();
  if (cached) {
    return cached.symbols;
  }

  const response = await fetchSymbols();
  if (Object.keys(response.symbols).length > 0) {
    const cachedSymbols = {
      symbols: response.symbols,
      fetchedAt: Date.now(),
    };
    await setCachedSymbols(cachedSymbols);
  }
  return response.symbols;
}
