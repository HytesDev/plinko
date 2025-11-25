import { writable } from 'svelte/store';

export const isGameSettingsOpen = writable<boolean>(false);

export const isLiveStatsOpen = writable<boolean>(false);

export const isAdminPanelOpen = writable<boolean>(false);

export const isCreditsOpen = writable<boolean>(false);

export const isChatOpen = writable<boolean>(false);
