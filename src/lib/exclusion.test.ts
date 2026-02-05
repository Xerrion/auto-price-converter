// Tests for URL/Domain exclusion utilities

import { describe, it, expect } from "vitest";
import {
  isUrlExcluded,
  extractDomain,
  extractUrlWithoutHash,
  normalizeUrl,
  matchesDomain,
  createExclusionEntry,
  getExclusionTypeLabel,
  exclusionExists,
} from "./exclusion";
import type { ExclusionEntry } from "./types";

describe("extractDomain", () => {
  it("extracts domain from a simple URL", () => {
    expect(extractDomain("https://example.com")).toBe("example.com");
  });

  it("extracts domain from URL with path", () => {
    expect(extractDomain("https://example.com/path/to/page")).toBe(
      "example.com",
    );
  });

  it("extracts domain from URL with subdomain", () => {
    expect(extractDomain("https://sub.example.com/page")).toBe("sub.example.com");
  });

  it("extracts domain from URL with www", () => {
    expect(extractDomain("https://www.example.com")).toBe("www.example.com");
  });

  it("extracts domain from URL with port", () => {
    expect(extractDomain("https://example.com:8080/page")).toBe("example.com");
  });

  it("lowercases domain", () => {
    expect(extractDomain("https://EXAMPLE.COM")).toBe("example.com");
  });

  it("handles invalid URL gracefully", () => {
    expect(extractDomain("not-a-url")).toBe("not-a-url");
  });
});

describe("extractUrlWithoutHash", () => {
  it("removes hash from URL", () => {
    expect(extractUrlWithoutHash("https://example.com/page#section")).toBe(
      "https://example.com/page",
    );
  });

  it("returns same URL if no hash", () => {
    expect(extractUrlWithoutHash("https://example.com/page")).toBe(
      "https://example.com/page",
    );
  });

  it("preserves query string", () => {
    expect(
      extractUrlWithoutHash("https://example.com/page?q=test#section"),
    ).toBe("https://example.com/page?q=test");
  });
});

describe("normalizeUrl", () => {
  it("removes trailing slash from path", () => {
    expect(normalizeUrl("https://example.com/page/")).toBe(
      "https://example.com/page",
    );
  });

  it("keeps trailing slash for root", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("lowercases hostname", () => {
    expect(normalizeUrl("https://EXAMPLE.COM/Page")).toBe(
      "https://example.com/Page",
    );
  });

  it("removes hash fragment", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page",
    );
  });
});

describe("matchesDomain", () => {
  describe("with subdomains (includeSubdomains = true)", () => {
    it("matches exact domain", () => {
      expect(matchesDomain("example.com", "example.com", true)).toBe(true);
    });

    it("matches www subdomain", () => {
      expect(matchesDomain("www.example.com", "example.com", true)).toBe(true);
    });

    it("matches any subdomain", () => {
      expect(matchesDomain("sub.example.com", "example.com", true)).toBe(true);
    });

    it("matches nested subdomains", () => {
      expect(matchesDomain("a.b.example.com", "example.com", true)).toBe(true);
    });

    it("does not match different domain", () => {
      expect(matchesDomain("other.com", "example.com", true)).toBe(false);
    });

    it("does not match partial domain name", () => {
      expect(matchesDomain("notexample.com", "example.com", true)).toBe(false);
    });
  });

  describe("without subdomains (includeSubdomains = false)", () => {
    it("matches exact domain", () => {
      expect(matchesDomain("example.com", "example.com", false)).toBe(true);
    });

    it("matches www as equivalent", () => {
      expect(matchesDomain("www.example.com", "example.com", false)).toBe(true);
    });

    it("does not match other subdomains", () => {
      expect(matchesDomain("sub.example.com", "example.com", false)).toBe(
        false,
      );
    });
  });
});

describe("isUrlExcluded", () => {
  const createEntry = (
    pattern: string,
    type: "url" | "domain" | "domain-exact",
  ): ExclusionEntry => ({
    id: `test-${Date.now()}`,
    pattern,
    type,
    addedAt: new Date().toISOString(),
  });

  it("returns false for empty exclusion list", () => {
    expect(isUrlExcluded("https://example.com", [])).toBe(false);
  });

  it("matches exact URL", () => {
    const list = [createEntry("https://example.com/page", "url")];
    expect(isUrlExcluded("https://example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://example.com/other", list)).toBe(false);
  });

  it("matches domain with subdomains", () => {
    const list = [createEntry("example.com", "domain")];
    expect(isUrlExcluded("https://example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://www.example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://sub.example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://other.com/page", list)).toBe(false);
  });

  it("matches domain-exact without subdomains", () => {
    const list = [createEntry("example.com", "domain-exact")];
    expect(isUrlExcluded("https://example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://www.example.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://sub.example.com/page", list)).toBe(false);
  });

  it("matches any entry in the list", () => {
    const list = [
      createEntry("https://site1.com/page", "url"),
      createEntry("site2.com", "domain"),
    ];
    expect(isUrlExcluded("https://site1.com/page", list)).toBe(true);
    expect(isUrlExcluded("https://site2.com/anything", list)).toBe(true);
    expect(isUrlExcluded("https://site3.com", list)).toBe(false);
  });
});

describe("createExclusionEntry", () => {
  it("creates URL entry with normalized URL", () => {
    const entry = createExclusionEntry("https://EXAMPLE.COM/page/", "url");
    expect(entry.type).toBe("url");
    expect(entry.pattern).toBe("https://example.com/page");
    expect(entry.id).toMatch(/^excl_/);
    expect(entry.addedAt).toBeDefined();
  });

  it("creates domain entry extracting domain only", () => {
    const entry = createExclusionEntry(
      "https://www.example.com/page?q=test",
      "domain",
    );
    expect(entry.type).toBe("domain");
    expect(entry.pattern).toBe("www.example.com");
  });

  it("creates domain-exact entry", () => {
    const entry = createExclusionEntry("https://example.com", "domain-exact");
    expect(entry.type).toBe("domain-exact");
    expect(entry.pattern).toBe("example.com");
  });
});

describe("getExclusionTypeLabel", () => {
  it("returns correct label for url type", () => {
    expect(getExclusionTypeLabel("url")).toBe("Exact URL");
  });

  it("returns correct label for domain type", () => {
    expect(getExclusionTypeLabel("domain")).toBe("Domain + Subdomains");
  });

  it("returns correct label for domain-exact type", () => {
    expect(getExclusionTypeLabel("domain-exact")).toBe("Domain Only");
  });
});

describe("exclusionExists", () => {
  const existingList: ExclusionEntry[] = [
    {
      id: "1",
      pattern: "https://example.com/page",
      type: "url",
      addedAt: "2024-01-01",
    },
    { id: "2", pattern: "blocked.com", type: "domain", addedAt: "2024-01-01" },
  ];

  it("detects existing URL exclusion", () => {
    expect(exclusionExists("https://example.com/page", "url", existingList)).toBe(
      true,
    );
  });

  it("does not match different URL", () => {
    expect(
      exclusionExists("https://example.com/other", "url", existingList),
    ).toBe(false);
  });

  it("detects existing domain exclusion", () => {
    expect(exclusionExists("https://blocked.com", "domain", existingList)).toBe(
      true,
    );
  });

  it("does not match same pattern with different type", () => {
    expect(
      exclusionExists("https://example.com/page", "domain", existingList),
    ).toBe(false);
  });
});
