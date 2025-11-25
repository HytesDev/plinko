<script lang="ts">
  import { defaultStartingBalance } from '$lib/constants/game';
  import {
    isMultiplayerConnected,
    multiplayerConfigured,
    requestBalanceReset,
  } from '$lib/network/multiplayer';
  import { balance, resetActivePlayer } from '$lib/stores/game';
  import { formatCurrency } from '$lib/utils/numbers';

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
      class="rounded-md bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-yellow-300 active:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:text-sm"
    >
      Reset to ${defaultStartingBalance}
    </button>
    {#if isResetting}
      <span class="text-xs text-slate-300">Resetting…</span>
    {/if}
  </div>
  {#if resetError}
    <p class="text-xs text-red-300">{resetError}</p>
  {/if}
</div>
