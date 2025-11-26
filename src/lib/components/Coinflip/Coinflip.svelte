<script lang="ts">
  import { coinflipWinRecords } from '$lib/stores/game';
  import { formatCurrency } from '$lib/utils/numbers';
  import CoinVertical from 'phosphor-svelte/lib/CoinVertical';
  import Sparkle from 'phosphor-svelte/lib/Sparkle';

  const maxHistory = 6;

  $: recentFlips = $coinflipWinRecords.slice(-maxHistory).toReversed();
  $: lastFlip = recentFlips[0];
</script>

<div class="relative h-full rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
    <div class="flex-1 space-y-2">
      <p class="text-xs uppercase tracking-[0.2em] text-amber-200">Coinflip</p>
      <h2 class="text-2xl font-bold">50/50 double or nothing</h2>
      <p class="text-sm text-slate-300">
        Every flip risks your bet for a clean double. Autobet uses the same interval and stop controls as Plinko.
      </p>
      {#if lastFlip}
        <div class="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-700/70 px-3 py-2 text-sm">
          <Sparkle class="size-4 text-amber-300" weight="fill" />
          <span class="font-semibold"
            >{lastFlip.outcome === 'WIN' ? 'Win' : 'Loss'} · {lastFlip.side === 'HEADS' ? 'Heads' : 'Tails'}</span
          >
          <span class="rounded-sm bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {lastFlip.payout.multiplier}×
          </span>
          <span
            class="tabular-nums"
            class:text-green-300={lastFlip.profit >= 0}
            class:text-red-300={lastFlip.profit < 0}
          >
            {formatCurrency(lastFlip.profit)}
          </span>
        </div>
      {:else}
        <p class="mt-2 text-sm text-slate-400">No flips yet. Place a bet to get started.</p>
      {/if}
    </div>

    <div class="flex flex-col items-center justify-center">
      <div class="relative h-40 w-40">
        <div
          class="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-500 opacity-60 blur-xl"
          aria-hidden="true"
        />
        <div
          class="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 text-slate-900 shadow-[0_15px_45px_rgba(0,0,0,0.35)]"
        >
          <div class="flex flex-col items-center gap-1 text-center">
            <CoinVertical class="size-12 drop-shadow" weight="fill" />
            <p class="text-sm font-semibold uppercase tracking-wide">
              {lastFlip ? (lastFlip.side === 'HEADS' ? 'Heads' : 'Tails') : 'Ready'}
            </p>
            <p class="text-xs text-slate-700">
              {lastFlip ? (lastFlip.outcome === 'WIN' ? 'Winner' : 'Busted') : '50/50 odds'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6">
    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-200">Recent flips</p>
      <p class="text-xs text-slate-400">Tracked per player</p>
    </div>
    {#if recentFlips.length === 0}
      <p class="mt-2 text-sm text-slate-400">You'll see your coinflip streak here.</p>
    {:else}
      <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {#each recentFlips as flip}
          <div class="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm shadow-inner">
            <div class="flex flex-col">
              <span class="text-[11px] uppercase tracking-wide text-slate-400">
                {new Date(flip.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span class="font-semibold text-slate-100">
                {flip.side === 'HEADS' ? 'Heads' : 'Tails'}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-sm bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                {flip.payout.multiplier}×
              </span>
              <span
                class="tabular-nums text-sm"
                class:text-green-300={flip.profit >= 0}
                class:text-red-300={flip.profit < 0}
              >
                {formatCurrency(flip.profit)}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
