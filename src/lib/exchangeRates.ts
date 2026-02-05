// Exchange rates API utilities using backend API

import currency from "currency.js";
import type {
  ExchangeRates,
  CachedRates,
  MajorCurrency,
  CurrencyCode,
} from "./types";
import { getCachedRates, setCachedRates } from "./storage";

const API_BASE_URL =
  import.meta.env.VITE_RATES_API_BASE ??
  "https://apc-api.up.railway.app";

/**
 * Fetches the latest exchange rates from the backend API
 * Uses EUR as base currency and fetches ALL available currencies
 */
export async function fetchLatestRates(): Promise<ExchangeRates> {
  const url = `${API_BASE_URL}/rates/latest`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.base && data.base !== "EUR") {
    throw new Error(`Unexpected base currency from backend: ${data.base}`);
  }

  return {
    base: "EUR",
    date: data.date,
    fetchedAt: data.fetched_at ?? undefined,
    rates: {
      EUR: 1,
      ...data.rates,
    },
  };
}

/**
 * Gets exchange rates, using cache if available and fresh
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Try to get cached rates first
  const cached = await getCachedRates();
  if (cached) {
    console.log("Using cached exchange rates from:", cached.rates.date);
    return cached.rates;
  }

  // Fetch fresh rates
  console.log("Fetching fresh exchange rates...");
  const rates = await fetchLatestRates();

  // Cache the rates
  const cachedRates: CachedRates = {
    rates,
    fetchedAt: Date.now(),
  };
  await setCachedRates(cachedRates);

  console.log("Exchange rates fetched and cached:", rates.date);
  return rates;
}

/**
 * Converts an amount from one currency to another using the provided rates
 * Uses currency.js for precise decimal arithmetic to avoid floating-point errors
 * fromCurrency: Major currency detected on the page
 * toCurrency: Any currency the user has selected as target
 */
export function convertCurrency(
  amount: number,
  fromCurrency: MajorCurrency,
  toCurrency: CurrencyCode,
  rates: ExchangeRates,
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to EUR first (base currency), then to target
  const fromRate = rates.rates[fromCurrency];
  const toRate = rates.rates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(
      `Missing exchange rate for ${fromCurrency} or ${toCurrency}`,
    );
  }

  // Use currency.js for precise arithmetic
  // Convert: amount in fromCurrency -> EUR -> toCurrency
  const amountInEur = currency(amount, { precision: 10 }).divide(fromRate);
  const convertedAmount = amountInEur.multiply(toRate);

  return convertedAmount.value;
}
