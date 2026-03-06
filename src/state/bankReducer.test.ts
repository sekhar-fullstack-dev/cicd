import { describe, expect, it } from 'vitest';
import { bankReducer, initialBankState } from './bankReducer';

const sampleTx = {
  id: 'tx-1',
  fromUserId: 'u1',
  fromName: 'Alice',
  toUserId: 'u2',
  toName: 'Bob',
  amount: 20,
  status: 'pending' as const,
  createdAt: new Date().toISOString()
};

describe('bankReducer', () => {
  it('adds and updates transactions', () => {
    const withTx = bankReducer(initialBankState, { type: 'upsert-transaction', payload: sampleTx });
    expect(withTx.transactions).toHaveLength(1);
    expect(withTx.transactions[0].status).toBe('pending');

    const updated = bankReducer(withTx, {
      type: 'upsert-transaction',
      payload: { ...sampleTx, status: 'success' }
    });
    expect(updated.transactions).toHaveLength(1);
    expect(updated.transactions[0].status).toBe('success');
  });

  it('sets message and loading', () => {
    const withLoading = bankReducer(initialBankState, { type: 'set-loading', payload: true });
    expect(withLoading.loading).toBe(true);

    const withMessage = bankReducer(withLoading, {
      type: 'set-message',
      payload: { type: 'info', text: 'ok' }
    });
    expect(withMessage.message?.text).toBe('ok');
  });
});
