<script lang="ts">
  import { players, activePlayerId } from '$lib/stores/game';
  import { formatCurrency } from '$lib/utils/numbers';
  import CrownSimple from 'phosphor-svelte/lib/CrownSimple';
  import ShieldCheck from 'phosphor-svelte/lib/ShieldCheck';

  const MAX_ROWS = 10;

  $: withProfit = [...$players]
    .map((player) => ({
      ...player,
      profit: player.totalProfitHistory.at(-1) ?? 0,
    }));

  $: balanceLeaders = [...withProfit].sort((a, b) => {
    if (b.balance === a.balance) {
      return b.profit - a.profit;
    }
    return b.balance - a.balance;
  });

  $: profitLeaders = [...withProfit].sort((a, b) => {
    if (b.profit === a.profit) {
      return b.balance - a.balance;
    }
    return b.profit - a.profit;
  });

  $: activeBalanceRank = balanceLeaders.findIndex((p) => p.id === $activePlayerId);
  $: activeProfitRank = profitLeaders.findIndex((p) => p.id === $activePlayerId);
  $: activePlayer = withProfit.find((p) => p.id === $activePlayerId);
</script>

<div class="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-lg">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <CrownSimple class="size-5 text-yellow-300" weight="fill" />
      <p class="text-sm font-semibold text-white">Leaderboard</p>
      <span class="relative inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
        <span class="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-green-300" />
      </span>
    </div>
    <p class="text-xs text-slate-400">Live rankings</p>
  </div>

  {#if $players.length === 0}
    <p class="mt-3 text-sm text-slate-400">No players yet.</p>
  {:else}
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <div class="overflow-hidden rounded-md border border-slate-700">
        <div class="flex items-center justify-between bg-slate-900 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-slate-400">Top balance</p>
          <p class="text-xs text-slate-500">Primary leaderboard</p>
        </div>
        <div class="grid grid-cols-[3rem,1fr,1fr,1fr] bg-slate-900 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
          <span>#</span>
          <span>Player</span>
          <span>Balance</span>
          <span>Profit</span>
        </div>
        {#each balanceLeaders.slice(0, MAX_ROWS) as entry, index}
          <div
            class="grid grid-cols-[3rem,1fr,1fr,1fr] items-center px-3 py-2 text-sm"
            class:bg-slate-700={entry.id === $activePlayerId}
          >
            <span class="font-semibold text-slate-300">{index + 1}</span>
            <div class="flex items-center gap-2 text-white">
              <span class="truncate">{entry.name}</span>
              {#if entry.isAdmin}
                <ShieldCheck class="size-4 text-cyan-300" weight="fill" aria-label="Admin" />
              {/if}
              {#if entry.id === $activePlayerId}
                <span class="rounded-sm bg-cyan-500 px-2 py-0.5 text-[11px] font-semibold text-slate-900">You</span>
              {/if}
            </div>
            <span class="tabular-nums text-slate-100">{formatCurrency(entry.balance)}</span>
            <span class="tabular-nums" class:text-green-300={entry.profit >= 0} class:text-red-300={entry.profit < 0}>
              {formatCurrency(entry.profit)}
            </span>
          </div>
        {/each}
      </div>

      <div class="overflow-hidden rounded-md border border-slate-700">
        <div class="flex items-center justify-between bg-slate-900 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-slate-400">Top profit</p>
          <p class="text-xs text-slate-500">All-time earnings</p>
        </div>
        <div class="grid grid-cols-[3rem,1fr,1fr,1fr] bg-slate-900 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
          <span>#</span>
          <span>Player</span>
          <span>Profit</span>
          <span>Balance</span>
        </div>
        {#each profitLeaders.slice(0, MAX_ROWS) as entry, index}
          <div
            class="grid grid-cols-[3rem,1fr,1fr,1fr] items-center px-3 py-2 text-sm"
            class:bg-slate-700={entry.id === $activePlayerId}
          >
            <span class="font-semibold text-slate-300">{index + 1}</span>
            <div class="flex items-center gap-2 text-white">
              <span class="truncate">{entry.name}</span>
              {#if entry.isAdmin}
                <ShieldCheck class="size-4 text-cyan-300" weight="fill" aria-label="Admin" />
              {/if}
              {#if entry.id === $activePlayerId}
                <span class="rounded-sm bg-cyan-500 px-2 py-0.5 text-[11px] font-semibold text-slate-900">You</span>
              {/if}
            </div>
            <span class="tabular-nums text-slate-100">{formatCurrency(entry.profit)}</span>
            <span class="tabular-nums text-slate-200">{formatCurrency(entry.balance)}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if activePlayer}
      <div class="mt-3 grid gap-3 text-sm text-white sm:grid-cols-2">
        <div class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded-sm bg-cyan-500 px-2 py-0.5 text-[11px] font-semibold text-slate-900">You</span>
              <p class="truncate">{activePlayer.name}</p>
            </div>
            <p class="text-xs text-slate-400">
              Balance rank #{activeBalanceRank >= 0 ? activeBalanceRank + 1 : '-'}
            </p>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <p class="text-xs text-slate-400">Balance</p>
            <p class="font-semibold text-slate-100">{formatCurrency(activePlayer.balance)}</p>
          </div>
        </div>
        <div class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="rounded-sm bg-cyan-500 px-2 py-0.5 text-[11px] font-semibold text-slate-900">You</span>
              <p class="truncate">{activePlayer.name}</p>
            </div>
            <p class="text-xs text-slate-400">
              Profit rank #{activeProfitRank >= 0 ? activeProfitRank + 1 : '-'}
            </p>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <p class="text-xs text-slate-400">Profit</p>
            <p class="font-semibold" class:text-green-300={activePlayer.profit >= 0} class:text-red-300={activePlayer.profit < 0}>
              {formatCurrency(activePlayer.profit)}
            </p>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
