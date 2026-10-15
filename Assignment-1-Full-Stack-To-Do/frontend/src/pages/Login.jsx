import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) return <Navigate to="/todos" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Please enter a valid email address.');
    if (!password) return setError('Please enter your password.');

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/todos', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card narrow">
      <h2>Log in</h2>
      {location.state?.registered && (
        <p className="msg success">Account created. Please log in.</p>
      )}
      {error && <p className="msg error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="small">No account yet? <Link to="/register">Register</Link></p>
    </div>
  );
}
