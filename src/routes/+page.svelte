<script lang="ts">
  import logo from '$lib/assets/logo.svg';
  import Balance from '$lib/components/Balance.svelte';
  import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import MultiplayerStatus from '$lib/components/MultiplayerStatus.svelte';
  import NamePrompt from '$lib/components/NamePrompt.svelte';
  import Coinflip from '$lib/components/Coinflip';
  import Plinko from '$lib/components/Plinko';
  import SettingsWindow from '$lib/components/SettingsWindow';
  import Sidebar from '$lib/components/Sidebar';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import CreditsWindow from '$lib/components/CreditsWindow.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BannedOverlay from '$lib/components/BannedOverlay.svelte';
  import AnnouncementBanner from '$lib/components/AnnouncementBanner.svelte';
  import { gameMode } from '$lib/stores/game';
  import { GameMode } from '$lib/types';
</script>

<div class="relative flex min-h-dvh w-full flex-col">
  <nav class="sticky top-0 z-10 w-full bg-gray-700 px-5 drop-shadow-lg">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4">
      <img src={logo} alt="logo" class="h-6 sm:h-7" />
      <MultiplayerStatus />
      <Balance />
    </div>
  </nav>

  <div class="flex-1 px-5">
    <div class="mx-auto mt-5 min-w-[300px] max-w-xl drop-shadow-xl md:mt-10 lg:max-w-7xl">
      <div class="mb-4 flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/80 p-3 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-slate-400">Game mode</p>
          <p class="text-sm text-slate-200">Switch between Plinko and Coinflip</p>
        </div>
        <div class="flex gap-2 rounded-full bg-slate-800 p-1">
          <button
            class="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 active:bg-slate-600"
            class:bg-slate-700={$gameMode === GameMode.PLINKO}
            on:click={() => ($gameMode = GameMode.PLINKO)}
          >
            Plinko
          </button>
          <button
            class="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 active:bg-slate-600"
            class:bg-slate-700={$gameMode === GameMode.COINFLIP}
            on:click={() => ($gameMode = GameMode.COINFLIP)}
          >
            Coinflip
          </button>
        </div>
      </div>

      <div class="flex flex-col-reverse overflow-hidden rounded-lg lg:w-full lg:flex-row">
        <Sidebar />
        <div class="flex-1">
          {#if $gameMode === GameMode.PLINKO}
            <Plinko />
          {:else}
            <Coinflip />
          {/if}
        </div>
      </div>
      <div class="mt-6">
        <Leaderboard />
      </div>
    </div>
  </div>

  <SettingsWindow />
  <LiveStatsWindow />
  <NamePrompt />
  <AdminPanel />
  <CreditsWindow />
  <ChatWindow />
  <BannedOverlay />
  <AnnouncementBanner />

</div>

<style>
  :global(body) {
    @apply bg-gray-800;
  }
</style>
