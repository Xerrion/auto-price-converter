<script lang="ts">
  import type { Settings, Theme } from "$lib/types";
  import { THEMES, THEME_OPTIONS } from "$lib/types";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  interface Props {
    settings: Settings;
    onThemeChange?: (theme: Theme) => void;
  }

  let { settings = $bindable(), onThemeChange }: Props = $props();

  function handleThemeChange(value: string | undefined) {
    if (value) {
      settings.theme = value as Theme;
      onThemeChange?.(settings.theme);
    }
  }
</script>

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
        onValueChange={handleThemeChange}
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
