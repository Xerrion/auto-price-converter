<script lang="ts">
  import type { Settings, ExchangeRates, CurrencyCode } from "../lib/types";
  import { ALL_CURRENCIES, CURRENCY_CODES } from "../lib/types";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  let settings = $state<Settings | null>(null);
  let rates = $state<ExchangeRates | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

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

      settings = settingsResponse.settings;
      rates = ratesResponse.rates;
      loading = false;
    } catch (err) {
      error = "Failed to load settings";
      loading = false;
      console.error(err);
    }
  }

  async function toggleEnabled() {
    if (!settings) return;

    settings.enabled = !settings.enabled;
    await saveSettings();
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        payload: settings,
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  async function changeCurrency(value: string | undefined) {
    if (!settings || !value) return;

    settings.targetCurrency = value as CurrencyCode;
    await saveSettings();
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function getCurrencyInfo(code: CurrencyCode) {
    return ALL_CURRENCIES[code];
  }
</script>

<main class="w-[300px] p-4 bg-background">
  <Card.Root>
    <Card.Header class="pb-3">
      <Card.Title class="text-center text-lg">💱 Price Converter</Card.Title>
    </Card.Header>

    <Separator />

    <Card.Content class="pt-4">
      {#if loading}
        <div
          class="flex items-center justify-center py-8 text-muted-foreground"
        >
          Loading...
        </div>
      {:else if error}
        <div class="flex items-center justify-center py-8 text-destructive">
          {error}
        </div>
      {:else if settings}
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <Label for="enable-conversion" class="text-sm font-medium">
              Enable conversion
            </Label>
            <Switch
              id="enable-conversion"
              checked={settings.enabled}
              onCheckedChange={toggleEnabled}
            />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="currency-select" class="text-sm text-muted-foreground">
              Convert to:
            </Label>
            <Select.Root
              type="single"
              value={settings.targetCurrency}
              onValueChange={changeCurrency}
            >
              <Select.Trigger id="currency-select" class="w-full">
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

          {#if rates}
            <div class="flex justify-center">
              <Badge variant="secondary" class="text-xs">
                Rates from: {rates.date}
              </Badge>
            </div>
          {/if}

          <Button variant="outline" class="w-full" onclick={openOptions}>
            ⚙️ More Options
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</main>
