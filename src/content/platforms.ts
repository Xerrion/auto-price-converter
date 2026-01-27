// E-commerce platform configurations for price detection
// Each platform has specific selectors for finding price elements

export interface PlatformConfig {
  name: string;
  // CSS selectors for price containers
  selectors: string[];
  // Optional: selector for element containing full price text (e.g., screen reader text)
  offscreenSelector?: string;
  // Optional: selectors for price parts if no offscreen element
  parts?: {
    symbol?: string;
    whole?: string;
    decimal?: string;
    fraction?: string;
  };
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  // Amazon
  {
    name: "Amazon",
    selectors: [
      ".a-price",
      ".a-text-price",
      '[data-a-color="price"]',
      ".a-color-price",
    ],
    offscreenSelector: ".a-offscreen, .aok-offscreen",
    parts: {
      symbol: ".a-price-symbol",
      whole: ".a-price-whole",
      fraction: ".a-price-fraction",
    },
  },
  // WooCommerce
  {
    name: "WooCommerce",
    selectors: [
      ".woocommerce-Price-amount",
      ".price > .amount",
      ".product-price .amount",
      "ins .woocommerce-Price-amount", // Sale price
      ".cart_totals .amount",
    ],
    parts: {
      symbol: ".woocommerce-Price-currencySymbol",
    },
  },
  // Shopify
  {
    name: "Shopify",
    selectors: [
      // Target individual price items, NOT containers
      ".price-item--regular:not(:has(.price-item))",
      ".price-item--sale:not(:has(.price-item))",
      ".price-item:not(:has(.price-item))",
      ".money:not(:has(.money))",
      "[data-product-price]:not(:has([data-product-price]))",
      ".product-single__price:not(:has(.price-item))",
      ".cart__price .money",
    ],
  },
  // PrestaShop
  {
    name: "PrestaShop",
    selectors: [
      ".product-price",
      ".current-price",
      ".regular-price",
      '[itemprop="price"]',
      ".price.product-price",
      ".our_price_display",
      ".price_container .price",
    ],
  },
  // Magento
  {
    name: "Magento",
    selectors: [
      ".price-box .price",
      ".price-wrapper .price",
      ".special-price .price",
      ".regular-price .price",
      ".final-price .price",
      '[data-price-type="finalPrice"] .price',
      ".product-info-price .price",
    ],
  },
  // eBay
  {
    name: "eBay",
    selectors: [
      ".x-price-primary",
      ".s-item__price",
      '[itemprop="price"]',
      ".x-bin-price",
      ".display-price",
    ],
  },
  // Etsy
  {
    name: "Etsy",
    selectors: [
      ".currency-value",
      ".wt-text-title-01",
      '[data-buy-box-region="price"]',
      ".listing-page-price",
    ],
  },
  // BigCommerce
  {
    name: "BigCommerce",
    selectors: [
      ".price--withTax",
      ".price--withoutTax",
      ".productView-price",
      ".price-section .price",
    ],
  },
  // OpenCart
  {
    name: "OpenCart",
    selectors: [
      ".price-new",
      ".price-old",
      ".product-price",
      "#product .price",
    ],
  },
  // Generic price patterns (fallback for unknown platforms)
  {
    name: "Generic",
    selectors: [
      "[data-price]",
      '[itemprop="price"]',
      '.sale-price:not(:has([class*="price"]))',
      '.regular-price:not(:has([class*="price"]))',
      '.special-price:not(:has([class*="price"]))',
    ],
  },
];

// Build combined selector for all platforms
export const ALL_PRICE_SELECTORS = PLATFORM_CONFIGS.flatMap(
  (p) => p.selectors,
).join(", ");
