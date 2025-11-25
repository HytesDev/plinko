<script lang="ts">
  import DraggableWindow from '$lib/components/ui/DraggableWindow.svelte';
  import { chatFeed, sendChatMessage } from '$lib/network/multiplayer';
  import { isChatOpen } from '$lib/stores/layout';
  import { playerName } from '$lib/network/multiplayer';
  import { onMount } from 'svelte';
  import type { KeyboardEvent } from 'svelte/elements';

  let message = '';
  let status = '';
  let feedEl: HTMLDivElement;

  function closePanel() {
    isChatOpen.set(false);
  }

  function handleSend(e?: Event | KeyboardEvent) {
    e?.preventDefault();
    status = '';
    const result = sendChatMessage(message);
    if (!result.ok) {
      status = result.reason ?? 'Send failed';
      return;
    }
    message = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  }

  $: if (feedEl) {
    feedEl.scrollTop = feedEl.scrollHeight;
  }

  onMount(() => {
    const onKey = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

{#if $isChatOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <DraggableWindow class="w-[24rem] max-w-full" onClose={closePanel}>
      <svelte:fragment slot="title">
        <div class="flex flex-col">
          <div class="flex items-center gap-2 text-sm font-semibold text-white">
            <span class="rounded-sm bg-emerald-400 px-2 py-0.5 text-slate-900">Chat</span>
            <span>Live Room</span>
          </div>
          <p class="text-[11px] font-normal text-amber-200">
            Unmoderated. Admins may remove content.
          </p>
        </div>
      </svelte:fragment>

      <div class="flex max-h-[26rem] flex-col gap-3 text-sm text-white">
        <div
          class="flex-1 space-y-2 overflow-y-auto rounded-md bg-slate-800 p-3"
          bind:this={feedEl}
        >
          {#if $chatFeed.length === 0}
            <p class="text-xs text-slate-400">No messages yet.</p>
          {:else}
            {#each $chatFeed as msg}
              <div class="rounded-sm bg-slate-900/70 px-2 py-1">
                <p class="text-xs text-slate-400">
                  <span class="font-semibold text-slate-200">{msg.playerName}</span>
                  <span class="ml-1 text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </p>
                <p class="text-sm text-slate-100 break-words">{msg.text}</p>
              </div>
            {/each}
          {/if}
        </div>

        <form class="space-y-2" on:submit|preventDefault={handleSend}>
          <textarea
            class="h-20 w-full rounded-md bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
            bind:value={message}
            placeholder="Message as {$playerName}"
            on:keydown={handleKeydown}
            maxlength="256"
          />
          <div class="flex items-center justify-between">
            <p class="text-xs text-slate-400">Enter to send. Shift+Enter for newline.</p>
            <button
              type="submit"
              class="rounded-md bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 active:bg-cyan-600"
            >
              Send
            </button>
          </div>
          {#if status}
            <p class="text-xs text-red-300">{status}</p>
          {/if}
        </form>
      </div>
    </DraggableWindow>
  </div>
{/if}
