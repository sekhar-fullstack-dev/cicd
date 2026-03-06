export type TransferStatus = 'pending' | 'success' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  balance: number;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  status: TransferStatus;
  createdAt: string;
  reason?: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}
