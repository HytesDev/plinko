<script lang="ts">
  import { defaultStartingBalance } from '$lib/constants/game';
  import {
    isMultiplayerConnected,
    multiplayerConfigured,
    requestBalanceReset,
  } from '$lib/network/multiplayer';
  import { balance, resetActivePlayer } from '$lib/stores/game';
  import { isAdminPanelOpen, isChatOpen, isCreditsOpen } from '$lib/stores/layout';
  import { formatCurrency } from '$lib/utils/numbers';
  import ShieldCheck from 'phosphor-svelte/lib/ShieldCheck';
  import Info from 'phosphor-svelte/lib/Info';
  import ChatsCircle from 'phosphor-svelte/lib/ChatsCircle';

  let resetError = '';
  let isResetting = false;

  $: balanceFormatted = formatCurrency($balance);

  async function handleReset() {
    if (isResetting) return;
    resetError = '';
    isResetting = true;

    if (multiplayerConfigured && isMultiplayerConnected()) {
      const { ok, reason } = await requestBalanceReset();
      if (!ok) {
        resetError = reason ?? 'Reset failed';
      }
    } else {
      resetActivePlayer(defaultStartingBalance);
    }

    isResetting = false;
  }
</script>

<div class="flex items-center gap-3">
  <div
    class="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold tabular-nums text-white sm:text-base"
  >
    <span class="text-xs uppercase tracking-wide text-slate-500">Balance</span>
    <span class="min-w-16 text-right">{balanceFormatted}</span>
  </div>
  <div class="flex items-center gap-2">
    <button
      on:click={handleReset}
      disabled={isResetting}
      class="h-10 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-slate-900 transition hover:bg-yellow-300 active:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:text-sm"
    >
      Reset to ${defaultStartingBalance}
    </button>
    <button
      aria-label="Open admin panel"
      on:click={() => isAdminPanelOpen.set(true)}
      class="flex h-10 items-center gap-1 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 active:bg-slate-600 sm:text-sm"
      title="Admin"
    >
      <ShieldCheck class="size-4" weight="fill" />
    </button>
    <button
      aria-label="Open chat"
      on:click={() => isChatOpen.set(true)}
      class="flex h-10 items-center gap-1 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 active:bg-slate-600 sm:text-sm"
      title="Chat (unmoderated)"
    >
      <ChatsCircle class="size-4" weight="bold" />
    </button>
    <button
      aria-label="Open credits"
      on:click={() => isCreditsOpen.set(true)}
      class="flex h-10 items-center gap-1 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 active:bg-slate-600 sm:text-sm"
      title="Credits"
    >
      <Info class="size-4" weight="bold" />
    </button>
    {#if isResetting}
      <span class="text-xs text-slate-300">Resetting…</span>
    {/if}
  </div>
  {#if resetError}
    <p class="text-xs text-red-300">{resetError}</p>
  {/if}
</div>
