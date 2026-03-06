import { delay, http, HttpResponse } from 'msw';
import { isDuplicatePendingTransfer, validateTransferInput } from '../domain/transferRules';
import type { Transaction, User } from '../types';
import { getTransactions, getUsers, setTransactions, setUsers, toPublicUser } from './data';

function getUserFromAuthHeader(request: Request): User | null {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer token-user-')) {
    return null;
  }
  const userId = auth.replace('Bearer token-user-', '');
  return getUsers().find((user) => user.id === userId) ?? null;
}

function unauthorized() {
  return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export const handlers = [
  http.post('/api/register', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };
    const users = getUsers();
    const exists = users.some((user) => user.email.toLowerCase() === body.email.toLowerCase());
    if (exists) {
      return HttpResponse.json({ message: 'Email already registered.' }, { status: 409 });
    }
    if (!body.password || body.password.length < 8) {
      return HttpResponse.json({ message: 'Password should be at least 8 characters.' }, { status: 400 });
    }

    const newUser: User = {
      id: `u${users.length + 1}`,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      balance: 1000
    };
    setUsers([...users, newUser]);
    await delay(120);
    return HttpResponse.json({ token: `token-user-${newUser.id}`, user: toPublicUser(newUser) }, { status: 201 });
  }),

  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = getUsers().find(
      (entry) => entry.email.toLowerCase() === body.email.toLowerCase() && entry.password === body.password
    );
    await delay(100);
    if (!user) {
      return HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }
    return HttpResponse.json({ token: `token-user-${user.id}`, user: toPublicUser(user) });
  }),

  http.get('/api/recipients', async ({ request }) => {
    const currentUser = getUserFromAuthHeader(request);
    if (!currentUser) {
      return unauthorized();
    }

    const recipients = getUsers()
      .filter((user) => user.id !== currentUser.id)
      .map((user) => ({ id: user.id, name: user.name, email: user.email }));

    await delay(90);
    return HttpResponse.json({ recipients });
  }),

  http.get('/api/transactions', async ({ request }) => {
    const currentUser = getUserFromAuthHeader(request);
    if (!currentUser) {
      return unauthorized();
    }

    const transactions = getTransactions()
      .filter((tx) => tx.fromUserId === currentUser.id || tx.toUserId === currentUser.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    await delay(80);
    return HttpResponse.json({ transactions, balance: currentUser.balance });
  }),

  http.post('/api/transfers', async ({ request }) => {
    const sender = getUserFromAuthHeader(request);
    if (!sender) {
      return unauthorized();
    }

    const body = (await request.json()) as { recipientId: string; amount: number };
    const users = getUsers();
    const recipient = users.find((user) => user.id === body.recipientId);

    const validationError = validateTransferInput(sender, recipient, Number(body.amount));
    if (validationError) {
      return HttpResponse.json({ message: validationError }, { status: 400 });
    }

    const transactions = getTransactions();
    if (isDuplicatePendingTransfer(transactions, sender.id, body.recipientId, Number(body.amount))) {
      return HttpResponse.json({ message: 'Duplicate pending transfer detected.' }, { status: 409 });
    }

    const tx: Transaction = {
      id: `tx-${transactions.length + 1}`,
      fromUserId: sender.id,
      fromName: sender.name,
      toUserId: recipient!.id,
      toName: recipient!.name,
      amount: Number(body.amount),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setTransactions([tx, ...transactions]);
    await delay(150);
    return HttpResponse.json({ transaction: tx }, { status: 201 });
  }),

  http.post('/api/transactions/:id/verify', async ({ request, params }) => {
    const actor = getUserFromAuthHeader(request);
    if (!actor) {
      return unauthorized();
    }

    const transactions = getTransactions();
    const index = transactions.findIndex((tx) => tx.id === params.id);
    if (index < 0) {
      return HttpResponse.json({ message: 'Transaction not found.' }, { status: 404 });
    }

    const tx = transactions[index];
    if (tx.fromUserId !== actor.id && tx.toUserId !== actor.id) {
      return unauthorized();
    }

    if (tx.status !== 'pending') {
      return HttpResponse.json({ transaction: tx });
    }

    const users = getUsers();
    const sender = users.find((user) => user.id === tx.fromUserId);
    const recipient = users.find((user) => user.id === tx.toUserId);
    if (!sender || !recipient) {
      return HttpResponse.json({ message: 'Linked users missing.' }, { status: 500 });
    }

    let verifiedTx: Transaction;
    if (tx.amount > 500) {
      verifiedTx = { ...tx, status: 'failed', reason: 'Compliance check failed for amount above 500.' };
    } else if (sender.balance < tx.amount) {
      verifiedTx = { ...tx, status: 'failed', reason: 'Insufficient balance during verification.' };
    } else {
      sender.balance -= tx.amount;
      recipient.balance += tx.amount;
      verifiedTx = { ...tx, status: 'success' };
      setUsers([...users]);
    }

    const next = [...transactions];
    next[index] = verifiedTx;
    setTransactions(next);
    await delay(140);
    return HttpResponse.json({ transaction: verifiedTx, balance: sender.balance });
  })
];
