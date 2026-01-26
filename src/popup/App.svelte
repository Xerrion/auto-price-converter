<script lang="ts">
  let count = $state(0);

  function increment() {
    count++;
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }
</script>

<main>
  <h1>Chrome Extension</h1>
  <p>Built with Svelte + TypeScript</p>

  <div class="counter">
    <button onclick={increment}>
      Count: {count}
    </button>
  </div>

  <button class="options-btn" onclick={openOptions}> Open Options </button>
</main>

<style>
  main {
    text-align: center;
    padding: 1rem;
  }

  h1 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
    margin-bottom: 1rem;
  }

  .counter {
    margin-bottom: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #4a90d9;
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
  }

  button:hover {
    background: #357abd;
  }

  .options-btn {
    background: #6c757d;
  }

  .options-btn:hover {
    background: #545b62;
  }
</style>
