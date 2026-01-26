<script lang="ts">
  interface Settings {
    enabled: boolean;
    theme: string;
    notifications: boolean;
  }

  let settings = $state<Settings>({
    enabled: true,
    theme: "light",
    notifications: true,
  });

  let status = $state("");

  // Load settings on mount
  $effect(() => {
    chrome.storage.sync.get(["settings"], (result) => {
      if (result.settings) {
        settings = result.settings;
      }
    });
  });

  function saveSettings() {
    chrome.storage.sync.set({ settings }, () => {
      status = "Settings saved!";
      setTimeout(() => {
        status = "";
      }, 2000);
    });
  }
</script>

<main>
  <h1>Extension Options</h1>

  <div class="option">
    <label>
      <input type="checkbox" bind:checked={settings.enabled} />
      Enable Extension
    </label>
  </div>

  <div class="option">
    <label>
      Theme:
      <select bind:value={settings.theme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
    </label>
  </div>

  <div class="option">
    <label>
      <input type="checkbox" bind:checked={settings.notifications} />
      Enable Notifications
    </label>
  </div>

  <button onclick={saveSettings}>Save Settings</button>

  {#if status}
    <p class="status">{status}</p>
  {/if}
</main>

<style>
  main {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }

  .option {
    margin-bottom: 1rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: #444;
  }

  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #4a90d9;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }

  button:hover {
    background: #357abd;
  }

  .status {
    margin-top: 1rem;
    color: #28a745;
    font-weight: 500;
  }
</style>
