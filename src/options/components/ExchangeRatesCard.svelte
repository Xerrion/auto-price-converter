<script lang="ts">
  import type { ExchangeRates } from "$lib/types";
  import { MAJOR_CURRENCIES } from "$lib/types";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  interface Props {
    rates: ExchangeRates | null;
    onRefresh?: () => void;
  }

  let { rates, onRefresh }: Props = $props();

  function formatFetchedAt(fetchedAt?: string) {
    if (!fetchedAt) return rates?.date ?? "";
    const parsed = new Date(fetchedAt);
    if (Number.isNaN(parsed.getTime())) return fetchedAt;
    return parsed.toLocaleString();
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Exchange Rates</Card.Title>
  </Card.Header>
  <Card.Content>
    {#if rates}
      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge variant="outline">
            Last updated: {formatFetchedAt(rates.fetchedAt)}
          </Badge>
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

        <Button variant="outline" onclick={onRefresh}>
          Refresh Rates
        </Button>
      </div>
    {:else}
      <div class="space-y-4">
        <p class="text-muted-foreground">Exchange rates not loaded</p>
        <Button variant="outline" onclick={onRefresh}>
          Load Rates
        </Button>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
