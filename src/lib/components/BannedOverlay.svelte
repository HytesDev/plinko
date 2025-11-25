<script lang="ts">
  import { bannedUntil, connectionStatus } from '$lib/network/multiplayer';
  import { derived } from 'svelte/store';
  import { onDestroy, onMount } from 'svelte';
  import ShieldCheck from 'phosphor-svelte/lib/ShieldCheck';

  const banMessage = derived(bannedUntil, ($until) => {
    if (!$until) return null;
    const date = new Date($until);
    return `You are banned until ${date.toLocaleString()}.`;
  });

  let countdown = '';
  let timer: ReturnType<typeof setInterval> | null = null;

  function updateCountdown() {
    const until = $bannedUntil;
    if (!until) {
      countdown = '';
      return;
    }
    const msLeft = until - Date.now();
    if (msLeft <= 0) {
      countdown = 'Expired';
      return;
    }
    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, '0');
    countdown = `${hours}:${minutes}:${seconds}`;
  }

  const unsubscribe = bannedUntil.subscribe(() => updateCountdown());

  onMount(() => {
    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
    unsubscribe();
  });
</script>

{#if $bannedUntil && $connectionStatus === 'disabled'}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
    <div class="w-[min(540px,95vw)] space-y-5 rounded-xl border border-red-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 text-center shadow-2xl ring-1 ring-red-500/30">
      <div class="flex items-center justify-center gap-2">
        <span class="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">Banned</span>
        <ShieldCheck class="size-5 text-red-200" weight="bold" aria-hidden="true" />
      </div>
      <p class="text-xl font-semibold text-white">Access denied</p>
      <p class="text-sm text-slate-200">
        {$banMessage ?? 'You are banned from multiplayer.'}
      </p>
      {#if countdown}
        <p class="text-xs font-mono text-red-200">Time remaining: {countdown}</p>
      {/if}
      <p class="text-xs text-slate-400">
        If you think this is a mistake, contact an admin after the ban expires.
      </p>
    </div>
  </div>
{/if}
