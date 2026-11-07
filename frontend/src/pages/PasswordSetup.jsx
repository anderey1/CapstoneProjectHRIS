import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function PasswordSetup() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Passwords must match.'); return; }
    setPending(true);
    try {
      await axios.post(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace(/\/?$/, '/')}password-setup/`, { token: params.get('token'), password });
      setDone(true);
    } catch (failure) {
      const detail = failure.response?.data?.error;
      setError(Array.isArray(detail) ? detail.join(' ') : detail || 'Could not set password. Contact HR for a new link.');
    } finally { setPending(false); }
  }
  return <main className="min-h-screen flex items-center justify-center p-4"><section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
    <h1 className="text-xl font-semibold text-slate-900">Set your HRIS password</h1>
    {done ? <p className="mt-4">Password saved. <Link className="text-primary underline" to="/login">Log in</Link></p> : <form onSubmit={submit} className="mt-4 space-y-4">
      <p className="text-sm text-slate-600">Choose a strong password. Setup links expire after 24 hours.</p>
      <label className="block text-sm">New password<input autoComplete="new-password" required type="password" value={password} onChange={event => setPassword(event.target.value)} className="input input-bordered mt-1 w-full" /></label>
      <label className="block text-sm">Confirm password<input autoComplete="new-password" required type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="input input-bordered mt-1 w-full" /></label>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {!params.get('token') && <p role="alert" className="text-error">Setup link missing. Contact HR.</p>}
      <button className="btn btn-primary w-full" disabled={pending || !params.get('token')}>{pending ? 'Saving?' : 'Set password'}</button>
    </form>}
  </section></main>;
}
