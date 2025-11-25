<script lang="ts">
  import logo from '$lib/assets/logo.svg';
  import Balance from '$lib/components/Balance.svelte';
  import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import MultiplayerStatus from '$lib/components/MultiplayerStatus.svelte';
  import NamePrompt from '$lib/components/NamePrompt.svelte';
  import Plinko from '$lib/components/Plinko';
  import SettingsWindow from '$lib/components/SettingsWindow';
  import Sidebar from '$lib/components/Sidebar';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import CreditsWindow from '$lib/components/CreditsWindow.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import BannedOverlay from '$lib/components/BannedOverlay.svelte';
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
      <div class="flex flex-col-reverse overflow-hidden rounded-lg lg:w-full lg:flex-row">
        <Sidebar />
        <div class="flex-1">
          <Plinko />
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

</div>

<style>
  :global(body) {
    @apply bg-gray-800;
  }
</style>
