<script lang="ts">
  import {
    connectionStatus,
    initMultiplayer,
    playerName,
    renamePlayerOnServer,
  } from '$lib/network/multiplayer';
  import { activePlayerId, players } from '$lib/stores/game';
  import { ensureUniquePlayerName, generateRandomPlayerName } from '$lib/utils/playerNames';
  import { Popover } from 'bits-ui';
  import UserCircle from 'phosphor-svelte/lib/UserCircle';
  import { onMount } from 'svelte';

  let nameInput = '';
  let isPopoverOpen = false;
  let error = '';

  $: statusColor =
    $connectionStatus === 'connected'
      ? 'bg-green-400'
      : $connectionStatus === 'connecting'
        ? 'bg-yellow-400'
        : 'bg-red-400';
  $: onlineCount = $players.length;
  $: existingNames = $players
    .filter((player) => player.id !== $activePlayerId)
    .map((player) => player.name);
  let lastPlayerName = '';
  $: if ($playerName !== lastPlayerName) {
    nameInput = $playerName;
    lastPlayerName = $playerName;
  }

  onMount(() => {
    initMultiplayer();
    nameInput = $playerName;
  });

  function handleSubmit(event: Event) {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      error = 'Name is required';
      return;
    }
    error = '';
    const uniqueName = ensureUniquePlayerName(trimmed, existingNames);
    renamePlayerOnServer(uniqueName);
    isPopoverOpen = false;
  }

  function setRandomName() {
    error = '';
    nameInput = generateRandomPlayerName(existingNames);
  }
</script>

<div class="flex items-center gap-3 rounded-md bg-slate-800 px-3 py-2 text-sm text-white">
  <div class="flex items-center gap-2">
    <span class="relative inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
      <span class={`absolute inline-flex h-full w-full rounded-full ${statusColor} opacity-60 animate-ping`} />
      <span class={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`} />
    </span>
    <span class="text-xs uppercase tracking-wide text-slate-300">Multiplayer</span>
    <span class="text-xs text-slate-400">({onlineCount} online)</span>
  </div>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs text-slate-300 sm:inline">You are</span>
    <span class="truncate rounded-sm bg-slate-900 px-2 py-1 text-sm font-semibold text-white">
      {$playerName}
    </span>
    <Popover.Root bind:open={isPopoverOpen}>
      <Popover.Trigger asChild let:builder>
        <button
          use:builder.action
          {...builder}
          type="button"
          class="flex items-center gap-1 rounded-sm bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 active:bg-cyan-600"
        >
          <UserCircle class="size-4" weight="bold" />
          <span class="hidden sm:inline">Change</span>
          <span class="sm:hidden">Name</span>
        </button>
      </Popover.Trigger>
      <Popover.Content
        sideOffset={8}
        class="z-30 w-72 rounded-md border border-slate-700 bg-slate-900 p-4 text-sm text-white shadow-xl"
      >
        <form class="space-y-3" on:submit|preventDefault={handleSubmit}>
          <div class="space-y-1">
            <p class="text-xs uppercase tracking-wide text-slate-400">Update name</p>
            <p class="text-xs text-slate-400">Names are unique across the room.</p>
          </div>
          <label class="block text-xs text-slate-300">
            New name
            <input
              bind:value={nameInput}
              maxlength="24"
              class="mt-1 w-full rounded-sm bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
              placeholder="Player1234"
            />
          </label>
          {#if error}
            <p class="text-xs text-red-300">{error}</p>
          {/if}
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-sm bg-slate-800 px-3 py-2 text-xs font-semibold text-white ring-1 ring-slate-700 transition hover:bg-slate-700 active:bg-slate-600"
              on:click={setRandomName}
            >
              Random Player name
            </button>
            <button
              type="submit"
              class="rounded-sm bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 active:bg-cyan-600"
            >
              Save
            </button>
          </div>
        </form>
        <Popover.Arrow class="fill-slate-900" />
      </Popover.Content>
    </Popover.Root>
  </div>
</div>
