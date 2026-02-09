<script lang="ts">
  import type { Settings, ExchangeRates, Theme } from "../lib/types";
  import { applyTheme, watchSystemTheme } from "../lib/theme";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import { toast } from "svelte-sonner";

  // Card components
  import GeneralSettingsCard from "./components/GeneralSettingsCard.svelte";
  import DisplaySettingsCard from "./components/DisplaySettingsCard.svelte";
  import AppearanceCard from "./components/AppearanceCard.svelte";
  import ExclusionListCard from "./components/ExclusionListCard.svelte";
  import ExchangeRatesCard from "./components/ExchangeRatesCard.svelte";
  import BackupRestoreCard from "./components/BackupRestoreCard.svelte";

  let settings = $state<Settings>({
    enabled: true,
    targetCurrency: "EUR",
    showOriginalPrice: true,
    highlightConverted: true,
    decimalPlaces: 2,
    numberFormat: "en-US",
    theme: "system",
    exclusionList: [],
  });

  let rates = $state<ExchangeRates | null>(null);
  let symbols = $state<Record<string, string> | null>(null);
  let loading = $state(true);
  let cleanupThemeWatcher: (() => void) | null = null;

  // Load settings and rates on mount
  $effect(() => {
    loadData();
  });

  async function loadData() {
    try {
      const [settingsResponse, ratesResponse, symbolsResponse] =
        await Promise.all([
          chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
          chrome.runtime.sendMessage({ type: "GET_RATES" }),
          chrome.runtime.sendMessage({ type: "GET_SYMBOLS" }),
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
      symbols = symbolsResponse.symbols ?? null;
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
      toast.success("Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
    }
  }

  async function refreshRates() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "REFRESH_RATES",
      });
      if (response.rates) {
        rates = response.rates;
        toast.success("Exchange rates updated");
      } else {
        toast.error("Failed to refresh exchange rates");
      }
    } catch (err) {
      console.error("Failed to refresh rates:", err);
      toast.error("Failed to refresh exchange rates");
    }
  }

  function handleThemeChange(theme: Theme) {
    applyTheme(theme);
    cleanupThemeWatcher?.();
    cleanupThemeWatcher = watchSystemTheme(theme);
  }
</script>

<main class="min-h-screen bg-background p-8">
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="text-center mb-8 flex items-center justify-center gap-3">
      <img src="../icons/icon48.png" alt="Auto Price Converter" width="48" height="48" />
      <h1 class="text-2xl font-bold">Auto Price Converter Options</h1>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    {:else}
      <GeneralSettingsCard bind:settings {symbols} />
      <DisplaySettingsCard bind:settings />
      <AppearanceCard bind:settings onThemeChange={handleThemeChange} />
      <ExclusionListCard bind:settings />
      <ExchangeRatesCard {rates} onRefresh={refreshRates} />
      <BackupRestoreCard bind:settings onThemeChange={handleThemeChange} />

      <!-- Save Button -->
      <div class="flex justify-center">
        <Button size="lg" onclick={saveSettings}>Save Settings</Button>
      </div>
    {/if}
  </div>
</main>

<Toaster richColors duration={2000} />
