<script lang="ts">
  import { winFeed } from '$lib/network/multiplayer';
  import { binColorsByRowCount } from '$lib/constants/game';
  import ShieldCheck from 'phosphor-svelte/lib/ShieldCheck';

  $: winningFeed = $winFeed.filter(({ record }) => record.profit > 0);
</script>

<div class="space-y-2">
  <p class="text-sm font-semibold text-white">Recent global wins</p>
  <div class="max-h-48 space-y-2 overflow-auto rounded-md bg-slate-800 p-3">
    {#if winningFeed.length === 0}
      <p class="text-sm text-slate-400">No wins reported yet.</p>
    {:else}
      {#each winningFeed.toReversed() as { playerName, isAdmin, record: { binIndex, payout, rowCount } }}
        <div class="flex items-center justify-between rounded-sm bg-slate-700 px-2 py-1 text-sm text-slate-100">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{playerName}</span>
            {#if isAdmin}
              <ShieldCheck class="size-4 text-cyan-300" weight="fill" aria-label="Admin" />
            {/if}
            <span class="text-xs text-slate-400">{rowCount} rows</span>
          </div>
          <div
            class="rounded-sm px-2 py-1 text-sm font-bold text-gray-900"
            style:background-color={binColorsByRowCount[rowCount].background[binIndex]}
          >
            {payout.multiplier}×
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
