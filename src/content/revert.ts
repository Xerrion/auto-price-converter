// Price reversion utilities
// Restores original prices when extension is disabled or settings change

import { CONVERTED_ATTR, ORIGINAL_ATTR } from "./domUtils";

/**
 * Revert all converted prices back to their original content
 */
export function revertConvertedPrices(): void {
  const convertedElements = document.querySelectorAll(`[${CONVERTED_ATTR}]`);

  for (const element of convertedElements) {
    const originalContent = element.getAttribute(ORIGINAL_ATTR);
    if (!originalContent) continue;

    if (element.hasAttribute("data-original-text")) {
      // E-commerce container - restore innerHTML
      revertContainerElement(element as HTMLElement, originalContent);
    } else {
      // Text wrapper span - replace with text node
      revertTextSpan(element, originalContent);
    }
  }
}

/**
 * Revert an e-commerce price container element
 */
function revertContainerElement(
  element: HTMLElement,
  originalContent: string,
): void {
  element.innerHTML = originalContent;
  element.removeAttribute(CONVERTED_ATTR);
  element.removeAttribute(ORIGINAL_ATTR);
  element.removeAttribute("data-original-text");
  element.style.backgroundColor = "";
  element.style.borderRadius = "";
  element.style.padding = "";
  element.title = "";
}

/**
 * Revert a text wrapper span back to a text node
 */
function revertTextSpan(element: Element, originalContent: string): void {
  const textNode = document.createTextNode(originalContent);
  element.parentNode?.replaceChild(textNode, element);
}
