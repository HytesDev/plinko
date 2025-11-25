<script lang="ts">
  import {
    connectionStatus,
    initMultiplayer,
    playerName,
    renamePlayerOnServer,
  } from '$lib/network/multiplayer';
  import { players } from '$lib/stores/game';
  import { onMount } from 'svelte';

  let nameInput = '';

  $: statusColor =
    $connectionStatus === 'connected'
      ? 'bg-green-400'
      : $connectionStatus === 'connecting'
        ? 'bg-yellow-400'
        : 'bg-red-400';
  $: onlineCount = $players.length;
  $: if (nameInput !== $playerName) {
    nameInput = $playerName;
  }

  onMount(() => {
    initMultiplayer();
    nameInput = $playerName;
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    renamePlayerOnServer(nameInput.trim());
  }
</script>

<form
  class="flex items-center gap-3 rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
  on:submit|preventDefault={handleSubmit}
>
  <div class="flex items-center gap-2">
    <span class="relative inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
      <span class={`absolute inline-flex h-full w-full rounded-full ${statusColor} opacity-60 animate-ping`} />
      <span class={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`} />
    </span>
    <span class="text-xs uppercase tracking-wide text-slate-300">Multiplayer</span>
    <span class="text-xs text-slate-400">({onlineCount} online)</span>
  </div>
  <label class="flex items-center gap-2 text-xs text-slate-300">
    Name
    <input
      value={nameInput}
      on:input={(e) => (nameInput = e.currentTarget.value)}
      class="w-32 rounded-sm bg-slate-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
    />
  </label>
  <button
    type="submit"
    class="rounded-sm bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 active:bg-cyan-600"
  >
    Save
  </button>
</form>
