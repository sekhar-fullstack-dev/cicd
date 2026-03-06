import { FormEvent, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fetchRecipients, fetchTransactions, login, register, sendMoney, verifyTransaction } from './api/bankApi';
import { clearSession, readSession, saveSession } from './domain/auth';
import { bankReducer, initialBankState } from './state/bankReducer';
import type { Session, Transaction } from './types';

interface Recipient {
  id: string;
  name: string;
  email: string;
}

type AuthMode = 'login' | 'register';

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const [loginEmail, setLoginEmail] = useState('alice@bank.test');
  const [loginPassword, setLoginPassword] = useState('Pass1234!');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(50);

  const [state, dispatch] = useReducer(bankReducer, initialBankState);

  const pendingCount = useMemo(
    () => state.transactions.filter((tx) => tx.status === 'pending').length,
    [state.transactions]
  );

  useEffect(() => {
    const cached = readSession();
    if (cached) {
      setSession(cached);
      setBalance(cached.user.balance);
    }
  }, []);

  const loadDashboard = useCallback(async (token: string) => {
    dispatch({ type: 'set-loading', payload: true });
    try {
      const [recipientList, txData] = await Promise.all([fetchRecipients(token), fetchTransactions(token)]);
      setRecipients(recipientList);
      setRecipientId((current) => current || recipientList[0]?.id || '');
      dispatch({ type: 'set-transactions', payload: txData.transactions });
      setBalance(txData.balance);
      dispatch({ type: 'set-message', payload: { type: 'info', text: 'Dashboard refreshed.' } });
    } catch (error) {
      dispatch({
        type: 'set-message',
        payload: { type: 'error', text: (error as Error).message || 'Unable to fetch dashboard.' }
      });
    } finally {
      dispatch({ type: 'set-loading', payload: false });
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadDashboard(session.token);
  }, [loadDashboard, session]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    dispatch({ type: 'set-loading', payload: true });
    try {
      const next = await login({ email: loginEmail, password: loginPassword });
      saveSession(next);
      setSession(next);
      setBalance(next.user.balance);
      dispatch({ type: 'set-message', payload: { type: 'success', text: `Welcome back, ${next.user.name}.` } });
    } catch (error) {
      dispatch({ type: 'set-message', payload: { type: 'error', text: (error as Error).message } });
    } finally {
      dispatch({ type: 'set-loading', payload: false });
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    dispatch({ type: 'set-loading', payload: true });
    try {
      const next = await register({ name, email, password });
      saveSession(next);
      setSession(next);
      setBalance(next.user.balance);
      dispatch({ type: 'set-message', payload: { type: 'success', text: `Account created for ${next.user.name}.` } });
    } catch (error) {
      dispatch({ type: 'set-message', payload: { type: 'error', text: (error as Error).message } });
    } finally {
      dispatch({ type: 'set-loading', payload: false });
    }
  }

  async function handleSendMoney(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      dispatch({ type: 'set-message', payload: { type: 'error', text: 'Unauthorized. Please login.' } });
      return;
    }

    dispatch({ type: 'set-loading', payload: true });
    try {
      const resolvedRecipientId = recipientId || recipients[0]?.id;
      if (!resolvedRecipientId) {
        throw new Error('Recipient not found.');
      }
      const tx = await sendMoney(session.token, { recipientId: resolvedRecipientId, amount: Number(amount) });
      dispatch({ type: 'upsert-transaction', payload: tx });
      dispatch({ type: 'set-message', payload: { type: 'info', text: `Transfer ${tx.id} created and pending verification.` } });
    } catch (error) {
      dispatch({ type: 'set-message', payload: { type: 'error', text: (error as Error).message } });
    } finally {
      dispatch({ type: 'set-loading', payload: false });
    }
  }

  async function handleVerify(tx: Transaction) {
    if (!session) {
      return;
    }

    dispatch({ type: 'set-loading', payload: true });
    try {
      const result = await verifyTransaction(session.token, tx.id);
      dispatch({ type: 'upsert-transaction', payload: result.transaction });
      if (typeof result.balance === 'number') {
        setBalance(result.balance);
      }
      const message =
        result.transaction.status === 'success'
          ? `Transaction ${tx.id} verified successfully.`
          : `Transaction ${tx.id} failed verification: ${result.transaction.reason ?? 'Unknown reason'}`;
      dispatch({
        type: 'set-message',
        payload: {
          type: result.transaction.status === 'success' ? 'success' : 'error',
          text: message
        }
      });
    } catch (error) {
      dispatch({ type: 'set-message', payload: { type: 'error', text: (error as Error).message } });
    } finally {
      dispatch({ type: 'set-loading', payload: false });
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setRecipients([]);
    setBalance(0);
    dispatch({ type: 'set-transactions', payload: [] });
    dispatch({ type: 'set-message', payload: { type: 'info', text: 'Logged out successfully.' } });
  }

  return (
    <div className="app-shell" data-testid="app-shell">
      <h1>Simple Banking App</h1>

      {state.message && <div className={`msg ${state.message.type}`}>{state.message.text}</div>}

      {!session && (
        <div className="grid two-col" data-testid="auth-views">
          <section className="panel">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <label>
                Email
                <input
                  data-testid="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  data-testid="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </label>
              <button data-testid="login-submit" type="submit" disabled={state.loading}>
                Login
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Register</h2>
            <div className="inline">
              <span>Mode:</span>
              <button
                type="button"
                className={authMode === 'login' ? 'ghost' : 'secondary'}
                onClick={() => setAuthMode('login')}
              >
                Login First
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'ghost' : 'secondary'}
                onClick={() => setAuthMode('register')}
              >
                Register First
              </button>
            </div>
            <form onSubmit={handleRegister}>
              <label>
                Name
                <input
                  data-testid="register-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  data-testid="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  data-testid="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </label>
              <button data-testid="register-submit" type="submit" disabled={state.loading || authMode !== 'register'}>
                Register
              </button>
            </form>
          </section>
        </div>
      )}

      {session && (
        <div className="grid" data-testid="dashboard">
          <section className="panel">
            <div className="inline">
              <h2 data-testid="welcome">Welcome, {session.user.name}</h2>
              <span data-testid="balance">Balance: ${balance}</span>
              <span data-testid="pending-count">Pending: {pendingCount}</span>
              <button type="button" className="ghost" data-testid="refresh" onClick={() => void loadDashboard(session.token)}>
                Refresh
              </button>
              <button type="button" className="secondary" data-testid="logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>

          <div className="grid two-col">
            <section className="panel">
              <h2>Send Money</h2>
              <form onSubmit={handleSendMoney}>
                <label>
                  Recipient
                  <select
                    data-testid="recipient"
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                    required
                  >
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.email})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    data-testid="amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    required
                  />
                </label>
                <button data-testid="send-submit" type="submit" disabled={state.loading || recipients.length === 0}>
                  Send
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Transactions</h2>
              <div className="tx-list" data-testid="tx-list">
                {state.transactions.length === 0 && <div>No transactions yet.</div>}
                {state.transactions.map((tx) => (
                  <article key={tx.id} className="tx-item" data-testid={`tx-${tx.id}`}>
                    <div className="inline">
                      <strong>{tx.id}</strong>
                      <span className={`badge ${tx.status}`}>{tx.status}</span>
                    </div>
                    <div>
                      {tx.fromName} {'->'} {tx.toName} (${tx.amount})
                    </div>
                    {tx.reason && <div>{tx.reason}</div>}
                    {tx.status === 'pending' && tx.fromUserId === session.user.id && (
                      <button
                        type="button"
                        className="ghost"
                        data-testid={`verify-${tx.id}`}
                        onClick={() => void handleVerify(tx)}
                        disabled={state.loading}
                      >
                        Verify
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
