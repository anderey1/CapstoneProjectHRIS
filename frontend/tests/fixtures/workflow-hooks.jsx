import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useLoans } from '../../src/features/loans/hooks/useLoans';

// A caller of the public hook, independent of the screen's role permission checks.
export function LoanCaller() {
  const loans = useLoans(21);
  if (loans.isLoading) return <p>Loading</p>;
  return (
    <main>
      <output aria-label="Loan status">{loans.loans[0]?.status}</output>
      <button onClick={() => loans.verifyLoan(21)}>Verify</button>
      <button onClick={() => loans.approveLoan({ id: 21, remarks: 'Documents checked' })}>Approve</button>
      <button onClick={() => loans.disburseLoan(21)}>Release</button>
      <button onClick={() => loans.rejectLoan({ id: 21, remarks: 'Missing signature' })}>Reject</button>
    </main>
  );
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <ToastProvider><LoanCaller /></ToastProvider>
  </QueryClientProvider>,
);
