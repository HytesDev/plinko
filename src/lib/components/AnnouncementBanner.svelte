<script lang="ts">
  import { announcementMessage } from '$lib/network/multiplayer';
  import { flyAndScale } from '$lib/utils/transitions';
  import MegaphoneSimple from 'phosphor-svelte/lib/MegaphoneSimple';

  const CLEAR_DELAY = 15000;
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  $: {
    if ($announcementMessage) {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        announcementMessage.set(null);
      }, CLEAR_DELAY);
    }
  }

  function dismiss() {
    if (clearTimer) clearTimeout(clearTimer);
    announcementMessage.set(null);
  }
</script>

{#if $announcementMessage}
  <div
    transition:flyAndScale
    class="fixed left-1/2 top-16 z-40 w-[min(640px,94vw)] -translate-x-1/2 rounded-lg border border-amber-400/60 bg-amber-100/90 px-4 py-3 text-amber-950 shadow-2xl"
  >
    <div class="flex items-start gap-3">
      <MegaphoneSimple class="mt-0.5 size-5 text-amber-700" weight="fill" />
      <div class="flex-1">
        <p class="text-sm font-semibold uppercase tracking-wide text-amber-800">Announcement</p>
        <p class="text-sm leading-relaxed">{$announcementMessage}</p>
      </div>
      <button
        class="rounded-md px-2 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 active:bg-amber-300"
        on:click={dismiss}
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}
