import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { errorMessage } from '@/api/http';
import './AuthPage.css';

/** Registration page: create an account, then land logged in. */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== form.password;

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9._-]+"
              title="3–30 characters: letters, digits, dot, underscore or hyphen"
              value={form.username}
              onChange={update('username')}
            />
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

          <div className="auth__field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              maxLength={72}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={passwordsMismatch}
            />
            {passwordsMismatch && <span className="auth__hint">{"Passwords don't match"}</span>}
          </div>

          <button type="submit" className="auth__submit" disabled={submitting || passwordsMismatch}>
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
