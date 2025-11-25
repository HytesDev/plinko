<script lang="ts">
  import { bannedUntil, connectionStatus } from '$lib/network/multiplayer';
  import { derived } from 'svelte/store';

  const banMessage = derived(bannedUntil, ($until) => {
    if (!$until) return null;
    const date = new Date($until);
    return `You are banned until ${date.toLocaleString()}.`;
  });
</script>

{#if $bannedUntil && $connectionStatus === 'disabled'}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
    <div class="w-[min(520px,95vw)] space-y-4 rounded-xl border border-red-500/50 bg-slate-900 p-6 text-center shadow-2xl">
      <div class="flex justify-center">
        <span class="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">Banned</span>
      </div>
      <p class="text-lg font-semibold text-white">Access denied</p>
      <p class="text-sm text-slate-200">
        {$banMessage ?? 'You are banned from multiplayer.'}
      </p>
      <p class="text-xs text-slate-400">
        If you think this is a mistake, contact an admin after the ban expires.
      </p>
    </div>
  </div>
{/if}
