import { describe, expect, it } from 'vitest';
import { isDuplicatePendingTransfer, validateTransferInput } from './transferRules';
import type { Transaction, User } from '../types';

const sender: User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@bank.test',
  password: 'pw',
  balance: 100
};
const recipient: User = {
  id: 'u2',
  name: 'Bob',
  email: 'bob@bank.test',
  password: 'pw',
  balance: 50
};

describe('transferRules', () => {
  it('validates recipient and amount and balance', () => {
    expect(validateTransferInput(sender, undefined, 10)).toBe('Recipient not found.');
    expect(validateTransferInput(sender, recipient, 0)).toBe('Amount must be at least 1.');
    expect(validateTransferInput(sender, sender, 5)).toBe('You cannot send money to yourself.');
    expect(validateTransferInput(sender, recipient, 1000)).toBe('Insufficient funds.');
    expect(validateTransferInput(sender, recipient, 10)).toBeNull();
  });

  it('detects duplicate pending transfer within one minute', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        fromUserId: 'u1',
        fromName: 'Alice',
        toUserId: 'u2',
        toName: 'Bob',
        amount: 25,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];

    expect(isDuplicatePendingTransfer(transactions, 'u1', 'u2', 25)).toBe(true);
    expect(isDuplicatePendingTransfer(transactions, 'u1', 'u2', 30)).toBe(false);
  });
});
