<script lang="ts">
  import type { Settings } from "$lib/types";
  import { NUMBER_FORMATS, NUMBER_FORMAT_CODES } from "$lib/types";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  interface Props {
    settings: Settings;
  }

  let { settings = $bindable() }: Props = $props();
</script>

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
