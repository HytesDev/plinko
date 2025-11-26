<script lang="ts">
  import { binColorsByRowCount } from '$lib/constants/game';
  import { winFeed } from '$lib/network/multiplayer';
  import { isPlinkoWinRecord } from '$lib/types';
  import Coins from 'phosphor-svelte/lib/Coins';
  import ShieldCheck from 'phosphor-svelte/lib/ShieldCheck';

  $: winningFeed = $winFeed.filter(({ record }) => record.profit > 0);
</script>

<div class="space-y-2">
  <p class="text-sm font-semibold text-white">Recent global wins</p>
  <div class="max-h-48 space-y-2 overflow-auto rounded-md bg-slate-800 p-3">
    {#if winningFeed.length === 0}
      <p class="text-sm text-slate-400">No wins reported yet.</p>
    {:else}
      {#each winningFeed.toReversed() as { playerName, isAdmin, record }}
        {#if isPlinkoWinRecord(record)}
          <div class="flex items-center justify-between rounded-sm bg-slate-700 px-2 py-1 text-sm text-slate-100">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{playerName}</span>
              {#if isAdmin}
                <ShieldCheck class="size-4 text-cyan-300" weight="fill" aria-label="Admin" />
              {/if}
              <span class="text-xs text-slate-400">{record.rowCount} rows</span>
            </div>
            <div
              class="rounded-sm px-2 py-1 text-sm font-bold text-gray-900"
              style:background-color={binColorsByRowCount[record.rowCount].background[record.binIndex]}
            >
              {record.payout.multiplier}×
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-between rounded-sm bg-slate-700 px-2 py-1 text-sm text-slate-100">
            <div class="flex items-center gap-2">
              <Coins class="size-5 text-yellow-200" weight="fill" aria-hidden="true" />
              <span class="font-semibold">{playerName}</span>
              {#if isAdmin}
                <ShieldCheck class="size-4 text-cyan-300" weight="fill" aria-label="Admin" />
              {/if}
              <span class="text-xs text-slate-400">Coinflip</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-sm bg-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                {record.side === 'HEADS' ? 'Heads' : 'Tails'}
              </span>
              <span class="rounded-sm bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {record.payout.multiplier}×
              </span>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
