declare module "findandreplacedomtext" {
  interface Portion {
    /** The index of this portion within the match (0 for first, 1 for second, etc.) */
    index: number;
    /** The text content of this portion */
    text: string;
    /** The index where this portion starts within the full match text */
    indexInMatch: number;
    /** The index where this portion starts within the original node text */
    indexInNode: number;
    /** The index where this portion ends within the original node text */
    endIndexInNode: number;
    /** Whether this is the first portion of the match */
    isEnd: boolean;
    /** The original text node */
    node: Text;
  }

  interface FindAndReplaceDOMTextOptions {
    /** The regex pattern to search for */
    find: RegExp;
    /** Function to generate the replacement content */
    replace: (
      portion: Portion,
      match: RegExpMatchArray,
    ) => string | HTMLElement | Text;
    /** Optional function to filter which elements to search within */
    filterElements?: (element: Element) => boolean;
    /** The element to search within (defaults to document.body) */
    preset?: "prose";
  }

  interface FindAndReplaceDOMTextResult {
    /** Revert all replacements made by this instance */
    revert: () => void;
  }

  export default function findAndReplaceDOMText(
    element: HTMLElement,
    options: FindAndReplaceDOMTextOptions,
  ): FindAndReplaceDOMTextResult;
}
