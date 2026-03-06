import type { Transaction, User } from '../types';

const initialUsers: User[] = [
  { id: 'u1', name: 'Alice', email: 'alice@bank.test', password: 'Pass1234!', balance: 1500 },
  { id: 'u2', name: 'Bob', email: 'bob@bank.test', password: 'Pass1234!', balance: 800 },
  { id: 'u3', name: 'Charlie', email: 'charlie@bank.test', password: 'Pass1234!', balance: 400 }
];

let usersState: User[] = structuredClone(initialUsers);
let transactionsState: Transaction[] = [];

export function resetData(): void {
  usersState = structuredClone(initialUsers);
  transactionsState = [];
}

export function getUsers(): User[] {
  return usersState;
}

export function setUsers(next: User[]): void {
  usersState = next;
}

export function getTransactions(): Transaction[] {
  return transactionsState;
}

export function setTransactions(next: Transaction[]): void {
  transactionsState = next;
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance
  };
}
