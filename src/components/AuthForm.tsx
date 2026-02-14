import { useState } from 'react';
import '../styles/auth.css';

type AuthMode = 'signin' | 'magic';

interface AuthFormProps {
  onSignInWithPassword: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignInWithMagicLink: (email: string) => Promise<{ error: unknown }>;
}

export function AuthForm({ onSignInWithPassword, onSignInWithMagicLink }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'magic') {
        const { error } = await onSignInWithMagicLink(email);
        if (error) {
          setError(String(error));
        } else {
          setMessage('Check your email for a login link!');
        }
      } else {
        const { error } = await onSignInWithPassword(email, password);
        if (error) {
          setError(String(error));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-backdrop">
      <video
        className="auth-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/illbeyourtreasure.mp4" type="video/mp4" />
      </video>
      <div className="auth-card">
        <h1 className="auth-title">I'll Be Your Treasure</h1>
        <p className="auth-subtitle">Pacific Northwest Field Guide</p>

        <div className="auth-mode-tabs">
          <button
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'magic' ? 'active' : ''}`}
            onClick={() => { setMode('magic'); setError(null); setMessage(null); }}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              placeholder="your@email.com"
            />
          </label>

          {mode === 'signin' && (
            <label className="auth-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                placeholder="Your password"
                minLength={6}
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
