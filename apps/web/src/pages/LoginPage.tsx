import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { FormField } from '../components/auth/FormField';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      // The API deliberately returns the same message for "no such
      // account" and "wrong password" (see auth.service.ts) - shown
      // as-is here rather than reworded, so that anti-enumeration
      // behavior isn't undone on the client.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm border border-rule bg-white/95 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">Project Transparency PH</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-sm text-status-cancelled">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-faint">
          No account?{' '}
          <Link to="/register" className="font-medium text-signal hover:underline">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-faint">
          <Link to="/" className="hover:underline">
            ← Back to map
          </Link>
        </p>
      </div>
    </div>
  );
}
