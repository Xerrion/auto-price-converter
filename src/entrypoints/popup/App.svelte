<script lang="ts">
  import type { Settings, ExchangeRates, ExclusionType } from "$lib/types";
  import {
    createExclusionEntry,
    extractDomain,
    extractUrlWithoutHash,
    isUrlExcluded,
  } from "$lib/exclusion";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  interface PageInfo {
    title: string;
    url: string;
    domain: string;
    isExcluded: boolean;
  }

  let settings = $state<Settings | null>(null);
  let rates = $state<ExchangeRates | null>(null);
  let pageInfo = $state<PageInfo | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load settings and rates on mount
  $effect(() => {
    loadData();
  });

  async function loadData() {
    try {
      const [settingsResponse, ratesResponse] = await Promise.all([
        browser.runtime.sendMessage({ type: "GET_SETTINGS" }),
        browser.runtime.sendMessage({ type: "GET_RATES" }),
      ]);

      settings = settingsResponse.settings;
      rates = ratesResponse.rates;

      // Get page info from active tab
      await loadPageInfo();

      loading = false;
    } catch (err) {
      error = "Failed to load settings";
      loading = false;
      console.error(err);
    }
  }

  async function loadPageInfo() {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id && tab.url && !tab.url.startsWith("chrome://")) {
        const response = await browser.tabs.sendMessage(tab.id, {
          type: "GET_PAGE_INFO",
        });
        pageInfo = response;
      }
    } catch (err) {
      // Content script not loaded on this page (e.g., chrome:// pages)
      console.log("Could not get page info:", err);
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
      await browser.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        payload: settings,
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  async function addExclusion(type: ExclusionType) {
    if (!settings || !pageInfo) return;

    const pattern = type === "url" ? pageInfo.url : pageInfo.domain;
    const entry = createExclusionEntry(pattern, type);

    settings.exclusionList = [...settings.exclusionList, entry];
    await saveSettings();

    // Update local state to reflect exclusion
    pageInfo = { ...pageInfo, isExcluded: true };
  }

  async function removeExclusion() {
    if (!settings || !pageInfo) return;

    const url = pageInfo.url;
    const domain = extractDomain(url);
    const normalizedUrl = extractUrlWithoutHash(url);

    // Remove any exclusion that matches the current page
    settings.exclusionList = settings.exclusionList.filter((entry) => {
      if (entry.type === "url") {
        return !normalizedUrl.includes(entry.pattern) && entry.pattern !== normalizedUrl;
      }
      // For domain entries, check if the domain matches
      const entryDomain = entry.pattern.toLowerCase();
      const pageDomain = domain.toLowerCase();
      return entryDomain !== pageDomain && !pageDomain.endsWith("." + entryDomain);
    });

    await saveSettings();

    // Update local state
    pageInfo = { ...pageInfo, isExcluded: false };
  }

  // Check if page is excluded (re-evaluate when settings change)
  let isPageExcluded = $derived(
    pageInfo?.isExcluded ||
      (settings && pageInfo
        ? isUrlExcluded(pageInfo.url, settings.exclusionList)
        : false),
  );

  // Get domain without www. prefix for cleaner display
  function getDisplayDomain(url: string): string {
    return extractDomain(url).replace(/^www\./, "");
  }

  function openOptions() {
    browser.runtime.openOptionsPage();
  }

  function formatFetchedAt(fetchedAt?: string) {
    if (!fetchedAt) return rates?.date ?? "";
    const parsed = new Date(fetchedAt);
    if (Number.isNaN(parsed.getTime())) return fetchedAt;
    return parsed.toLocaleString();
  }
</script>

<main class="w-[300px] p-4 bg-background">
  <Card.Root>
    <Card.Header class="pb-3">
      <Card.Title class="flex items-center justify-center gap-2 text-lg">
        <img src="/icons/icon32.png" alt="" width="24" height="24" />
        Auto Price Converter
      </Card.Title>
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

          {#if rates}
            <div class="flex justify-center">
              <Badge variant="secondary" class="text-xs">
                Rates from: {formatFetchedAt(rates.fetchedAt)}
              </Badge>
            </div>
          {/if}

          <!-- Page exclusion section -->
          {#if pageInfo}
            <Separator />

            <div class="flex flex-col gap-2">
              {#if isPageExcluded}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Badge variant="destructive" class="text-xs">
                      Excluded
                    </Badge>
                    <span class="text-xs text-muted-foreground truncate max-w-[120px]" title={pageInfo.domain}>
                      {pageInfo.domain}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={removeExclusion}
                  >
                    Enable
                  </Button>
                </div>
              {:else}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                      <Button {...props} variant="outline" size="sm" class="w-full">
                        🚫 Exclude this site
                      </Button>
                    {/snippet}
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content class="w-[250px]">
                    <DropdownMenu.Label>Exclude from conversion</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={() => addExclusion("url")}>
                      <div class="flex flex-col gap-1">
                        <span class="font-medium">This exact URL</span>
                        <span class="text-xs text-muted-foreground truncate max-w-[220px]">
                          {extractUrlWithoutHash(pageInfo.url)}
                        </span>
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => addExclusion("domain")}>
                      <div class="flex flex-col gap-1">
                        <span class="font-medium">Entire domain</span>
                        <span class="text-xs text-muted-foreground">
                          *.{getDisplayDomain(pageInfo.url)} (includes subdomains)
                        </span>
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => addExclusion("domain-exact")}>
                      <div class="flex flex-col gap-1">
                        <span class="font-medium">This domain only</span>
                        <span class="text-xs text-muted-foreground">
                          {getDisplayDomain(pageInfo.url)} (no subdomains)
                        </span>
                      </div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              {/if}
            </div>
          {/if}

          <Button variant="outline" class="w-full" onclick={openOptions}>
            ⚙️ Options
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</main>
