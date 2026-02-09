<script lang="ts">
  import type { Settings, CurrencyCode } from "$lib/types";
  import { getCurrencyName, getCurrencySymbol, getCurrencyList } from "$lib/currency";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  interface Props {
    settings: Settings;
    symbols?: Record<string, string> | null;
  }

  let { settings = $bindable(), symbols = null }: Props = $props();
</script>

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
        Target Currency ({getCurrencyList(symbols).length} available)
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
            {getCurrencySymbol(settings.targetCurrency)}
            {settings.targetCurrency} -
            {getCurrencyName(settings.targetCurrency, symbols)}
          {:else}
            Select currency
          {/if}
        </Select.Trigger>
        <Select.Content>
          {#each getCurrencyList(symbols) as currency}
            <Select.Item value={currency}>
              {getCurrencySymbol(currency)}
              {currency} - {getCurrencyName(currency, symbols)}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </Card.Content>
</Card.Root>
