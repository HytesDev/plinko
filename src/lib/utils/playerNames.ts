const NAME_PREFIX = 'Player';

function buildRandomName() {
  const randomNumber = Math.floor(Math.random() * 10000);
  return `${NAME_PREFIX}${randomNumber.toString().padStart(4, '0')}`;
}

export function generateRandomPlayerName(existingNames: string[] = []): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  let candidate = buildRandomName();

  while (taken.has(candidate.toLowerCase())) {
    candidate = buildRandomName();
  }

  return candidate;
}

export function ensureUniquePlayerName(baseName: string, existingNames: string[] = []): string {
  const trimmed = (baseName || '').trim() || NAME_PREFIX;
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));

  if (!taken.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  let counter = 2;
  let candidate = `${trimmed} (${counter})`;
  while (taken.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${trimmed} (${counter})`;
  }

  return candidate;
}
