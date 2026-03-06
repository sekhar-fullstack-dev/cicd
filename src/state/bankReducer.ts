import type { Transaction } from '../types';

export interface BankState {
  loading: boolean;
  message: { type: 'error' | 'success' | 'info'; text: string } | null;
  transactions: Transaction[];
}

export type BankAction =
  | { type: 'set-loading'; payload: boolean }
  | { type: 'set-message'; payload: BankState['message'] }
  | { type: 'set-transactions'; payload: Transaction[] }
  | { type: 'upsert-transaction'; payload: Transaction };

export const initialBankState: BankState = {
  loading: false,
  message: null,
  transactions: []
};

export function bankReducer(state: BankState, action: BankAction): BankState {
  switch (action.type) {
    case 'set-loading':
      return { ...state, loading: action.payload };
    case 'set-message':
      return { ...state, message: action.payload };
    case 'set-transactions':
      return { ...state, transactions: action.payload };
    case 'upsert-transaction': {
      const hasExisting = state.transactions.some((tx) => tx.id === action.payload.id);
      if (hasExisting) {
        return {
          ...state,
          transactions: state.transactions.map((tx) => (tx.id === action.payload.id ? action.payload : tx))
        };
      }
      return { ...state, transactions: [action.payload, ...state.transactions] };
    }
    default:
      return state;
  }
}
