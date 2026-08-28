// lib/reservations.ts

const STORAGE_KEY = "my_raffle_reservations";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markAsMine(numberId: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = readIds();
    if (!ids.includes(numberId)) {
      ids.push(numberId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // localStorage no disponible, no hacemos nada
  }
}

export function isMine(numberId: string): boolean {
  return readIds().includes(numberId);
}