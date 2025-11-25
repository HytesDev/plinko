<script lang="ts">
  import DraggableWindow from '$lib/components/ui/DraggableWindow.svelte';
  import { defaultStartingBalance } from '$lib/constants/game';
  import {
    adminAuthState,
    adminError,
    adminRemovePlayer,
    adminRenamePlayer,
    adminResetPlayer,
    adminSetBalance,
    authenticateAdmin,
  } from '$lib/network/multiplayer';
  import { players } from '$lib/stores/game';
  import { isAdminPanelOpen } from '$lib/stores/layout';
  import { formatCurrency } from '$lib/utils/numbers';

  let password = '';
  let actionMessage = '';
  let renameInputs: Record<string, string> = {};
  let balanceInputs: Record<string, string> = {};
  let isSaving = false;

  $: {
    const activeIds = new Set($players.map((player) => player.id));
    renameInputs = Object.fromEntries(
      Object.entries(renameInputs).filter(([id]) => activeIds.has(id)),
    );
    balanceInputs = Object.fromEntries(
      Object.entries(balanceInputs).filter(([id]) => activeIds.has(id)),
    );
    for (const player of $players) {
      if (!renameInputs[player.id]) {
        renameInputs = { ...renameInputs, [player.id]: player.name };
      }
      if (!balanceInputs[player.id]) {
        balanceInputs = { ...balanceInputs, [player.id]: player.balance.toString() };
      }
    }
  }

  function closePanel() {
    isAdminPanelOpen.set(false);
  }

  async function handleUnlock(event: Event) {
    event.preventDefault();
    if (!password.trim()) return;
    isSaving = true;
    actionMessage = '';
    await authenticateAdmin(password.trim());
    isSaving = false;
  }

  async function handleRename(playerId: string) {
    isSaving = true;
    actionMessage = '';
    adminError.set(null);
    const name = renameInputs[playerId] ?? '';
    if (!name.trim()) {
      adminError.set('Enter a username to save.');
      isSaving = false;
      return;
    }
    const result = await adminRenamePlayer(playerId, name);
    if (result.ok) {
      renameInputs = { ...renameInputs, [playerId]: name.trim() };
      actionMessage = 'Username updated';
    }
    isSaving = false;
  }

  async function handleBalance(playerId: string) {
    isSaving = true;
    actionMessage = '';
    adminError.set(null);
    const balanceValue = parseFloat(balanceInputs[playerId] ?? '');
    if (!Number.isFinite(balanceValue)) {
      adminError.set('Enter a valid balance.');
      isSaving = false;
      return;
    }
    const result = await adminSetBalance(playerId, balanceValue);
    if (result.ok) {
      balanceInputs = { ...balanceInputs, [playerId]: balanceValue.toString() };
      actionMessage = 'Balance saved';
    }
    isSaving = false;
  }

  async function handleReset(playerId: string) {
    isSaving = true;
    actionMessage = '';
    adminError.set(null);
    const result = await adminResetPlayer(playerId);
    if (result.ok) {
      balanceInputs = { ...balanceInputs, [playerId]: defaultStartingBalance.toString() };
      actionMessage = 'Player reset';
    }
    isSaving = false;
  }

  async function handleRemove(playerId: string) {
    isSaving = true;
    actionMessage = '';
    adminError.set(null);
    const result = await adminRemovePlayer(playerId);
    if (result.ok) {
      const { [playerId]: _, ...restNames } = renameInputs;
      const { [playerId]: __, ...restBalances } = balanceInputs;
      renameInputs = restNames;
      balanceInputs = restBalances;
      actionMessage = 'Player removed';
    }
    isSaving = false;
  }
</script>

{#if $isAdminPanelOpen}
  <DraggableWindow class="fixed bottom-6 right-6 w-[22rem]" onClose={closePanel}>
    <svelte:fragment slot="title">
      <div class="flex items-center gap-2 text-sm font-semibold text-white">
        <span class="rounded-sm bg-cyan-400 px-2 py-0.5 text-slate-900">Admin</span>
        <span>Control Room</span>
      </div>
    </svelte:fragment>

    {#if $adminAuthState === 'authorized'}
      <div class="space-y-3 text-sm text-white">
        <div class="rounded-md border border-slate-600 bg-slate-800 p-3">
          <p class="text-xs uppercase tracking-wide text-slate-400">Players ({$players.length})</p>
        </div>

        {#if $players.length === 0}
          <p class="text-sm text-slate-300">No active players.</p>
        {:else}
          <div class="space-y-3 max-h-[24rem] overflow-y-auto pr-1">
            {#each $players as player}
              <div class="rounded-md border border-slate-600 bg-slate-800 p-3 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-white">{player.name}</p>
                  <p class="text-xs text-slate-400">{formatCurrency(player.balance)}</p>
                </div>
                <div class="mt-2 space-y-2">
                  <label class="block text-xs text-slate-300">
                    Username
                    <div class="mt-1 flex gap-2">
                      <input
                        class="w-full rounded-sm bg-slate-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
                        bind:value={renameInputs[player.id]}
                        maxlength="24"
                        placeholder="New username"
                      />
                      <button
                        class="rounded-sm bg-cyan-500 px-3 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        on:click={() => handleRename(player.id)}
                        disabled={isSaving}
                      >
                        Save
                      </button>
                    </div>
                  </label>
                  <label class="block text-xs text-slate-300">
                    Balance
                    <div class="mt-1 flex gap-2">
                      <input
                        class="w-full rounded-sm bg-slate-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
                        bind:value={balanceInputs[player.id]}
                        type="number"
                        step="0.01"
                      />
                      <button
                        class="rounded-sm bg-blue-400 px-3 text-xs font-semibold text-slate-900 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                        on:click={() => handleBalance(player.id)}
                        disabled={isSaving}
                      >
                        Update
                      </button>
                    </div>
                  </label>
                  <div class="flex items-center gap-2">
                    <button
                      class="flex-1 rounded-sm bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                      on:click={() => handleReset(player.id)}
                      disabled={isSaving}
                    >
                      Reset Player
                    </button>
                    <button
                      class="flex-1 rounded-sm bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      on:click={() => handleRemove(player.id)}
                      disabled={isSaving}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if $adminError}
          <p class="rounded-md bg-red-900/70 px-3 py-2 text-xs text-red-200">{$adminError}</p>
        {/if}
        {#if actionMessage}
          <p class="rounded-md bg-emerald-900/60 px-3 py-2 text-xs text-emerald-200">{actionMessage}</p>
        {/if}
      </div>
    {:else}
      <form class="space-y-3 text-sm text-white" on:submit|preventDefault={handleUnlock}>
        <p class="text-slate-200">Enter admin password to manage players.</p>
        <input
          class="w-full rounded-sm bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
          type="password"
          bind:value={password}
          placeholder="Password"
        />
        <button
          class="w-full rounded-sm bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSaving}
        >
          {$adminAuthState === 'pending' ? 'Checking...' : 'Unlock'}
        </button>
        {#if $adminError}
          <p class="rounded-md bg-red-900/70 px-3 py-2 text-xs text-red-200">{$adminError}</p>
        {/if}
      </form>
    {/if}
  </DraggableWindow>
{/if}
