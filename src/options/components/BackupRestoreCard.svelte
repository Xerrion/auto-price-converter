<script lang="ts">
  import type { Settings, Theme } from "$lib/types";
  import {
    exportSettings,
    parseSettingsFile,
    SettingsImportError,
  } from "$lib/settings-io";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { toast } from "svelte-sonner";

  interface Props {
    settings: Settings;
    onThemeChange?: (theme: Theme) => void;
  }

  let { settings = $bindable(), onThemeChange }: Props = $props();

  let fileInputEl = $state<HTMLInputElement | null>(null);

  function handleExport() {
    exportSettings(settings);
    toast.success("Settings exported");
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const imported = await parseSettingsFile(file);
      settings = imported.settings;
      onThemeChange?.(settings.theme);
      toast.success("Settings imported successfully!");
    } catch (err) {
      if (err instanceof SettingsImportError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to import settings");
        console.error(err);
      }
    }

    // Reset input so the same file can be selected again
    input.value = "";
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Backup & Restore</Card.Title>
    <p class="text-sm text-muted-foreground">
      Export your settings to a file or import from a backup
    </p>
  </Card.Header>
  <Card.Content>
    <div class="flex gap-3">
      <Button variant="outline" onclick={handleExport}>
        Export Settings
      </Button>
      <Button variant="outline" onclick={() => fileInputEl?.click()}>
        Import Settings
      </Button>
      <input
        type="file"
        accept=".json,application/json"
        class="hidden"
        bind:this={fileInputEl}
        onchange={handleImport}
      />
    </div>
  </Card.Content>
</Card.Root>
