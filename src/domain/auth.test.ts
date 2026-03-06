import { describe, expect, it } from 'vitest';
import { clearSession, parseUserIdFromToken, readSession, saveSession } from './auth';

describe('auth session helpers', () => {
  it('persists and reads session', () => {
    const session = {
      token: 'token-user-u1',
      user: { id: 'u1', name: 'Alice', email: 'alice@bank.test', balance: 100 }
    };

    saveSession(session);
    expect(readSession()).toEqual(session);
    clearSession();
    expect(readSession()).toBeNull();
  });

  it('parses user id from valid token', () => {
    expect(parseUserIdFromToken('token-user-u9')).toBe('u9');
    expect(parseUserIdFromToken('invalid')).toBeNull();
  });
});
