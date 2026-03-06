import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App integration flows', () => {
  it('logs in, creates pending transfer, verifies success', async () => {
    render(<App />);

    await userEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();

    const amountInput = screen.getByTestId('amount');
    await waitFor(() => expect(screen.getByTestId('recipient')).toHaveValue('u2'));
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '120');

    await userEvent.click(screen.getByTestId('send-submit'));

    const pendingTx = await screen.findByTestId('tx-tx-1');
    expect(pendingTx).toHaveTextContent('pending');

    await userEvent.click(screen.getByTestId('verify-tx-1'));

    await waitFor(() => {
      expect(screen.getByTestId('tx-tx-1')).toHaveTextContent('success');
    });
  });

  it('shows login error on invalid credentials', async () => {
    render(<App />);

    await userEvent.clear(screen.getByTestId('login-email'));
    await userEvent.type(screen.getByTestId('login-email'), 'wrong@bank.test');
    await userEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
  });

  it('blocks transfer with insufficient funds', async () => {
    render(<App />);

    await userEvent.click(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('recipient')).toHaveValue('u2');
      expect(screen.getByTestId('send-submit')).toBeEnabled();
    });
    await userEvent.clear(screen.getByTestId('amount'));
    await userEvent.type(screen.getByTestId('amount'), '3000');
    await userEvent.click(screen.getByTestId('send-submit'));

    expect(await screen.findByText('Insufficient funds.')).toBeInTheDocument();
  });

  it('registers a user and opens dashboard', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Register First' }));
    await userEvent.type(screen.getByTestId('register-name'), 'Diana');
    await userEvent.type(screen.getByTestId('register-email'), 'diana@bank.test');
    await userEvent.type(screen.getByTestId('register-password'), 'Pass1234!');
    await userEvent.click(screen.getByTestId('register-submit'));

    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('welcome')).toHaveTextContent('Diana');
  });
});
