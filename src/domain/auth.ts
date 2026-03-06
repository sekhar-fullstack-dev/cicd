import type { Session } from '../types';

const SESSION_KEY = 'banking-session';

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function parseUserIdFromToken(token: string): string | null {
  const prefix = 'token-user-';
  if (!token.startsWith(prefix)) {
    return null;
  }
  return token.replace(prefix, '') || null;
}
