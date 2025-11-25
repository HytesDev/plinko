import { LOCAL_STORAGE_KEY } from '$lib/constants/game';
import { balance } from '$lib/stores/game';
import { roundToCents } from '$lib/utils/numbers';
import { get } from 'svelte/store';

export function setBalanceFromLocalStorage() {
  const balanceVal = window.localStorage.getItem(LOCAL_STORAGE_KEY.BALANCE);
  if (balanceVal) {
    balance.set(roundToCents(parseFloat(balanceVal)));
  }
}

export function writeBalanceToLocalStorage() {
  const balanceVal = roundToCents(get(balance));
  window.localStorage.setItem(LOCAL_STORAGE_KEY.BALANCE, balanceVal.toFixed(2));
}
