import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/http';
import './AuthPage.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__brand">Raft</h1>
        <p className="auth__subtitle">Create your account to get started</p>

        <form className="auth__form" onSubmit={onSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__row">
            <div className="auth__field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" required maxLength={50} value={form.firstName} onChange={update('firstName')} />
            </div>
            <div className="auth__field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" required maxLength={50} value={form.lastName} onChange={update('lastName')} />
            </div>
          </div>

          <div className="auth__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              maxLength={100}
              value={form.email}
              onChange={update('email')}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              pattern="(?=.*[A-Za-z])(?=.*\d).{8,72}"
              title="At least 8 characters, including one letter and one digit"
              value={form.password}
              onChange={update('password')}
            />
          </div>

          <button type="submit" className="auth__submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
