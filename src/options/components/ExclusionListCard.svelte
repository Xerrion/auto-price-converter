<script lang="ts">
  import type { Settings } from "$lib/types";
  import { getExclusionTypeLabel } from "$lib/exclusion";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  interface Props {
    settings: Settings;
  }

  let { settings = $bindable() }: Props = $props();

  function removeExclusion(id: string) {
    settings.exclusionList = settings.exclusionList.filter(
      (entry) => entry.id !== id,
    );
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Exclusion List</Card.Title>
    <p class="text-sm text-muted-foreground">
      URLs and domains where price conversion is disabled
    </p>
  </Card.Header>
  <Card.Content>
    {#if settings.exclusionList.length === 0}
      <p class="text-sm text-muted-foreground py-4 text-center">
        No exclusions yet. Use the popup menu on any page to exclude it
        from conversion.
      </p>
    {:else}
      <div class="space-y-2">
        {#each settings.exclusionList as entry (entry.id)}
          <div
            class="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center gap-3 min-w-0">
              <Badge variant="secondary" class="shrink-0">
                {getExclusionTypeLabel(entry.type)}
              </Badge>
              <span class="text-sm font-mono truncate" title={entry.pattern}>
                {entry.pattern}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onclick={() => removeExclusion(entry.id)}
            >
              Remove
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
