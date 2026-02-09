import { CONVERTED_ATTR, ORIGINAL_ATTR } from "./domUtils";

export function revertConvertedPrices(): void {
  const convertedElements = document.querySelectorAll(`[${CONVERTED_ATTR}]`);

  for (const element of convertedElements) {
    const originalContent = element.getAttribute(ORIGINAL_ATTR);
    if (!originalContent) continue;

    const textNode = document.createTextNode(originalContent);
    element.parentNode?.replaceChild(textNode, element);
  }
}
