import type { Transaction, User } from '../types';

export const MIN_TRANSFER_AMOUNT = 1;

export function isValidAmount(rawAmount: number): boolean {
  return Number.isFinite(rawAmount) && rawAmount >= MIN_TRANSFER_AMOUNT;
}

export function hasSufficientFunds(balance: number, amount: number): boolean {
  return balance >= amount;
}

export function canSendToRecipient(senderId: string, recipientId: string): boolean {
  return senderId !== recipientId;
}

export function validateTransferInput(sender: User, recipient: User | undefined, amount: number): string | null {
  if (!recipient) {
    return 'Recipient not found.';
  }
  if (!isValidAmount(amount)) {
    return 'Amount must be at least 1.';
  }
  if (!canSendToRecipient(sender.id, recipient.id)) {
    return 'You cannot send money to yourself.';
  }
  if (!hasSufficientFunds(sender.balance, amount)) {
    return 'Insufficient funds.';
  }
  return null;
}

export function isDuplicatePendingTransfer(
  transactions: Transaction[],
  senderId: string,
  recipientId: string,
  amount: number
): boolean {
  return transactions.some((tx) => {
    if (tx.status !== 'pending') {
      return false;
    }
    const isSameTransfer = tx.fromUserId === senderId && tx.toUserId === recipientId && tx.amount === amount;
    const age = Date.now() - new Date(tx.createdAt).getTime();
    return isSameTransfer && age < 60_000;
  });
}
