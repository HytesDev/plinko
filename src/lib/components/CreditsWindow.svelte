<script lang="ts">
  import DraggableWindow from '$lib/components/ui/DraggableWindow.svelte';
  import { isCreditsOpen } from '$lib/stores/layout';

  function closePanel() {
    isCreditsOpen.set(false);
  }
</script>

{#if $isCreditsOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <DraggableWindow class="w-[22rem] max-w-full" onClose={closePanel}>
      <svelte:fragment slot="title">
        <div class="flex items-center gap-2 text-sm font-semibold text-white">
          <span class="rounded-sm bg-indigo-400 px-2 py-0.5 text-slate-900">Credits</span>
          <span>Project Origins</span>
        </div>
      </svelte:fragment>

      <div class="space-y-2 text-sm text-white">
        <p>
          Original repository:
          <a
            class="text-blue-200 underline"
            href="https://github.com/plinko-game-online/plinko-game-online.github.io"
            target="_blank"
            rel="noreferrer"
          >
            plinko-game-online/plinko-game-online.github.io
          </a>
        </p>
        <p>Multiplayer enhancements, admin tooling, and UI refinements built with ChatGPT Codex.</p>
      </div>
    </DraggableWindow>
  </div>
{/if}
