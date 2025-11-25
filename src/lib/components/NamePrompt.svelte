<script lang="ts">
  import { playerName, renamePlayerOnServer, shouldPromptForName } from '$lib/network/multiplayer';

  let nameInput = '';
  let error = '';

  $: if ($playerName && nameInput === '') {
    nameInput = $playerName;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      error = 'Pick a name to continue';
      return;
    }
    error = '';
    renamePlayerOnServer(trimmed);
  }
</script>

{#if $shouldPromptForName}
  <div class="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur">
    <div class="w-[min(90vw,420px)] rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-2xl">
      <h2 class="text-lg font-semibold text-white">Pick a username</h2>
      <p class="mt-1 text-sm text-slate-300">We'll show this on the global leaderboard.</p>
      <form class="mt-4 space-y-3" on:submit={handleSubmit}>
        <label class="block text-sm font-medium text-slate-200">
          Username
          <input
            bind:value={nameInput}
            maxlength="24"
            class="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500"
            placeholder="Your name"
          />
        </label>
        {#if error}
          <p class="text-xs text-red-300">{error}</p>
        {/if}
        <button
          type="submit"
          class="w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 active:bg-cyan-600"
        >
          Save name
        </button>
      </form>
    </div>
  </div>
{/if}
