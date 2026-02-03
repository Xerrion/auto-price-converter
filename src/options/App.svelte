<script lang="ts">
  import type {
    Settings,
    ExchangeRates,
    CurrencyCode,
    Theme,
  } from "../lib/types";
  import {
    ALL_CURRENCIES,
    CURRENCY_CODES,
    MAJOR_CURRENCIES,
    NUMBER_FORMATS,
    NUMBER_FORMAT_CODES,
    THEMES,
    THEME_OPTIONS,
  } from "../lib/types";
  import { applyTheme, watchSystemTheme } from "../lib/theme";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  let settings = $state<Settings>({
    enabled: true,
    targetCurrency: "EUR",
    showOriginalPrice: true,
    highlightConverted: true,
    decimalPlaces: 2,
    numberFormat: "en-US",
    theme: "system",
  });

  let rates = $state<ExchangeRates | null>(null);
  let loading = $state(true);
  let cleanupThemeWatcher: (() => void) | null = null;

  // Load settings and rates on mount
  $effect(() => {
    loadData();
  });

  async function loadData() {
    try {
      const [settingsResponse, ratesResponse] = await Promise.all([
        chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
        chrome.runtime.sendMessage({ type: "GET_RATES" }),
      ]);

      if (settingsResponse.settings) {
        settings = settingsResponse.settings;
        applyTheme(settings.theme);
        cleanupThemeWatcher?.();
        cleanupThemeWatcher = watchSystemTheme(settings.theme);
      }
      if (ratesResponse.rates) {
        rates = ratesResponse.rates;
      }
      loading = false;
    } catch (err) {
      console.error("Failed to load data:", err);
      loading = false;
    }
  }

  async function saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        payload: settings,
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  async function refreshRates() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "REFRESH_RATES",
      });
      if (response.rates) {
        rates = response.rates;
      }
    } catch (err) {
      console.error("Failed to refresh rates:", err);
    }
  }

  function getCurrencyInfo(code: CurrencyCode) {
    return ALL_CURRENCIES[code];
  }
</script>

<main class="min-h-screen bg-background p-8">
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold">💱 Price Converter Options</h1>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    {:else}
      <!-- General Settings -->
      <Card.Root>
        <Card.Header>
          <Card.Title>General Settings</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="enable-conversion" class="text-base font-medium">
                Enable Price Conversion
              </Label>
              <p class="text-sm text-muted-foreground">
                Turn on automatic price conversion on all websites
              </p>
            </div>
            <Switch
              id="enable-conversion"
              checked={settings.enabled}
              onCheckedChange={(checked: boolean) => {
                settings.enabled = checked;
              }}
            />
          </div>

          <Separator />

          <div class="space-y-2">
            <Label for="target-currency" class="text-base font-medium">
              Target Currency
            </Label>
            <p class="text-sm text-muted-foreground">
              All detected prices will be converted to this currency
            </p>
            <Select.Root
              type="single"
              value={settings.targetCurrency}
              onValueChange={(value: string | undefined) => {
                if (value) settings.targetCurrency = value as CurrencyCode;
              }}
            >
              <Select.Trigger id="target-currency" class="w-full">
                {#if settings.targetCurrency}
                  {getCurrencyInfo(settings.targetCurrency).symbol}
                  {settings.targetCurrency} - {getCurrencyInfo(
                    settings.targetCurrency,
                  ).name}
                {:else}
                  Select currency
                {/if}
              </Select.Trigger>
              <Select.Content>
                {#each CURRENCY_CODES as currency}
                  <Select.Item value={currency}>
                    {getCurrencyInfo(currency).symbol}
                    {currency} - {getCurrencyInfo(currency).name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Display Settings -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Display Settings</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="show-original" class="text-base font-medium">
                Show Original Price
              </Label>
              <p class="text-sm text-muted-foreground">
                Display the original price in parentheses after the converted
                price
              </p>
            </div>
            <Switch
              id="show-original"
              checked={settings.showOriginalPrice}
              onCheckedChange={(checked: boolean) => {
                settings.showOriginalPrice = checked;
              }}
            />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="highlight" class="text-base font-medium">
                Highlight Converted Prices
              </Label>
              <p class="text-sm text-muted-foreground">
                Add a subtle yellow background to converted prices
              </p>
            </div>
            <Switch
              id="highlight"
              checked={settings.highlightConverted}
              onCheckedChange={(checked: boolean) => {
                settings.highlightConverted = checked;
              }}
            />
          </div>

          <Separator />

          <div class="space-y-2">
            <Label for="decimals" class="text-base font-medium">
              Decimal Places
            </Label>
            <Select.Root
              type="single"
              value={String(settings.decimalPlaces)}
              onValueChange={(value: string | undefined) => {
                if (value) settings.decimalPlaces = Number(value) as 0 | 1 | 2;
              }}
            >
              <Select.Trigger id="decimals" class="w-[200px]">
                {settings.decimalPlaces === 0
                  ? "0 (e.g., €10)"
                  : settings.decimalPlaces === 1
                    ? "1 (e.g., €10.5)"
                    : "2 (e.g., €10.50)"}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="0">0 (e.g., €10)</Select.Item>
                <Select.Item value="1">1 (e.g., €10.5)</Select.Item>
                <Select.Item value="2">2 (e.g., €10.50)</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <Separator />

          <div class="space-y-2">
            <Label for="number-format" class="text-base font-medium">
              Number Format
            </Label>
            <p class="text-sm text-muted-foreground">
              How thousands and decimals are displayed
            </p>
            <Select.Root
              type="single"
              value={settings.numberFormat}
              onValueChange={(value: string | undefined) => {
                if (value)
                  settings.numberFormat = value as typeof settings.numberFormat;
              }}
            >
              <Select.Trigger id="number-format" class="w-[200px]">
                {NUMBER_FORMATS[settings.numberFormat].name}
              </Select.Trigger>
              <Select.Content>
                {#each NUMBER_FORMAT_CODES as format}
                  <Select.Item value={format}>
                    {NUMBER_FORMATS[format].name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Appearance -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Appearance</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <Label for="theme" class="text-base font-medium">Theme</Label>
            <p class="text-sm text-muted-foreground">
              Choose your preferred color scheme
            </p>
            <Select.Root
              type="single"
              value={settings.theme}
              onValueChange={(value: string | undefined) => {
                if (value) {
                  settings.theme = value as Theme;
                  applyTheme(settings.theme);
                  cleanupThemeWatcher?.();
                  cleanupThemeWatcher = watchSystemTheme(settings.theme);
                }
              }}
            >
              <Select.Trigger id="theme" class="w-[200px]">
                {THEMES[settings.theme].icon}
                {THEMES[settings.theme].name}
              </Select.Trigger>
              <Select.Content>
                {#each THEME_OPTIONS as theme}
                  <Select.Item value={theme}>
                    {THEMES[theme].icon}
                    {THEMES[theme].name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Exchange Rates -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Exchange Rates</Card.Title>
        </Card.Header>
        <Card.Content>
          {#if rates}
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <Badge variant="outline">Last updated: {rates.date}</Badge>
                <Badge variant="outline">Base: {rates.base}</Badge>
              </div>

              <div
                class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-muted rounded-lg"
              >
                {#each MAJOR_CURRENCIES.filter((c) => c !== rates?.base) as currency}
                  <div class="flex flex-col">
                    <span class="font-semibold text-sm">{currency}</span>
                    <span class="text-xs text-muted-foreground">
                      {rates.rates[currency]?.toFixed(4) || "N/A"}
                    </span>
                  </div>
                {/each}
              </div>

              <Button variant="outline" onclick={refreshRates}>
                🔄 Refresh Rates
              </Button>
            </div>
          {:else}
            <div class="space-y-4">
              <p class="text-muted-foreground">Exchange rates not loaded</p>
              <Button variant="outline" onclick={refreshRates}>
                Load Rates
              </Button>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Save Button -->
      <div class="flex justify-center">
        <Button size="lg" onclick={saveSettings}>Save Settings</Button>
      </div>
    {/if}
  </div>
</main>
