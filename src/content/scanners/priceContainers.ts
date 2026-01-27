// E-commerce price container processing
// Handles structured price elements from known platforms

import { convertCurrency } from "../../lib/exchangeRates";
import type { Settings, ExchangeRates } from "../../lib/types";

import { ALL_PRICE_SELECTORS } from "./platforms";
import { parsePrice } from "../parsers/priceParser";
import { extractPriceText } from "./priceExtractor";
import { formatPrice } from "../parsers/formatter";
import {
  CONVERTED_ATTR,
  ORIGINAL_ATTR,
  PENDING_ATTR,
  applyFadingHighlight,
  isInViewport,
} from "../utils/domUtils";
import { observeForConversion } from "../utils/observers";

/** Selectors for child price elements (to detect wrapper containers) */
const CHILD_PRICE_SELECTORS =
  '.price-item, .money, [data-price], .woocommerce-Price-amount, .a-price, [class*="price-item"]';

/**
 * Check if an element should be skipped during container processing
 */
function shouldSkipElement(element: Element, allElements: Element[]): boolean {
  if (element.hasAttribute(CONVERTED_ATTR)) return true;
  if (element.hasAttribute(PENDING_ATTR)) return true;

  // Skip elements inside already-converted elements
  if (element.closest(`[${CONVERTED_ATTR}]`)) return true;

  // Skip nested price elements (if another price element contains this one)
  const isNestedPrice = allElements.some(
    (other) => other !== element && other.contains(element),
  );
  if (isNestedPrice) return true;

  // Skip container elements that contain multiple price items
  const childPriceElements = element.querySelectorAll(CHILD_PRICE_SELECTORS);
  if (childPriceElements.length > 1) return true;

  return false;
}

/**
 * Convert a single price element
 */
export function convertPriceElement(
  element: HTMLElement,
  settings: Settings,
  exchangeRates: ExchangeRates,
): void {
  if (element.hasAttribute(CONVERTED_ATTR)) return;

  const priceText = extractPriceText(element);
  if (!priceText) return;

  // Skip if the extracted text contains multiple prices
  const priceMatches = priceText.match(
    /\$[\d,.]+|\€[\d,.]+|£[\d,.]+|[\d,.]+\s*(USD|EUR|GBP|SEK|NOK|DKK|kr)/gi,
  );
  if (priceMatches && priceMatches.length > 1) {
    return;
  }

  const parsed = parsePrice(priceText);
  if (!parsed) return;

  // Skip if same currency as target
  if (parsed.currency === settings.targetCurrency) return;

  // Convert the price
  const convertedAmount = convertCurrency(
    parsed.amount,
    parsed.currency,
    settings.targetCurrency,
    exchangeRates,
  );

  const formattedPrice = formatPrice(
    convertedAmount,
    settings.targetCurrency,
    settings.decimalPlaces,
    settings.numberFormat,
  );

  // Store original and mark as converted
  element.setAttribute(CONVERTED_ATTR, "true");
  element.setAttribute(ORIGINAL_ATTR, element.innerHTML);
  element.setAttribute("data-original-text", priceText);

  // Replace content
  if (settings.showOriginalPrice) {
    element.innerHTML = `<span class="converted-price">${formattedPrice}</span> <span class="original-price" style="font-size: 0.85em; opacity: 0.7;">(${priceText})</span>`;
  } else {
    element.textContent = formattedPrice;
  }

  // Apply fading highlight
  if (settings.highlightConverted) {
    applyFadingHighlight(element);
  }

  element.title = `Converted from ${priceText}`;
}

/**
 * Process all price containers in the given element
 */
export function processPriceContainers(
  container: HTMLElement,
  settings: Settings,
  exchangeRates: ExchangeRates,
): void {
  let priceElements: NodeListOf<Element>;
  try {
    priceElements = container.querySelectorAll(ALL_PRICE_SELECTORS);
  } catch (e) {
    console.error("Price Converter: Selector error", e);
    return;
  }

  const elementsToProcess: Element[] = [...priceElements];
  try {
    if (container.matches?.(ALL_PRICE_SELECTORS)) {
      elementsToProcess.unshift(container);
    }
  } catch {
    // matches() can throw on invalid selectors
  }

  for (const element of elementsToProcess) {
    if (shouldSkipElement(element, elementsToProcess)) continue;

    const htmlElement = element as HTMLElement;

    // If element is in viewport, convert immediately; otherwise observe
    if (isInViewport(htmlElement)) {
      convertPriceElement(htmlElement, settings, exchangeRates);
    } else {
      observeForConversion(htmlElement);
    }
  }
}
