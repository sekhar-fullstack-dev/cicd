import type { Session, Transaction } from '../types';

interface Recipient {
  id: string;
  name: string;
  email: string;
}

async function request<T>(url: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });
  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : 'Request failed.';
    throw new Error(message);
  }

  return data as T;
}

export async function register(payload: { name: string; email: string; password: string }): Promise<Session> {
  return request<Session>('/api/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function login(payload: { email: string; password: string }): Promise<Session> {
  return request<Session>('/api/login', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchRecipients(token: string): Promise<Recipient[]> {
  const data = await request<{ recipients: Recipient[] }>('/api/recipients', {}, token);
  return data.recipients;
}

export async function fetchTransactions(token: string): Promise<{ transactions: Transaction[]; balance: number }> {
  return request<{ transactions: Transaction[]; balance: number }>('/api/transactions', {}, token);
}

export async function sendMoney(token: string, payload: { recipientId: string; amount: number }): Promise<Transaction> {
  const data = await request<{ transaction: Transaction }>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
  return data.transaction;
}

export async function verifyTransaction(token: string, transactionId: string): Promise<{ transaction: Transaction; balance?: number }> {
  return request<{ transaction: Transaction; balance?: number }>(`/api/transactions/${transactionId}/verify`, {
    method: 'POST'
  }, token);
}
