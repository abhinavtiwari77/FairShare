import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold dark:text-zinc-50">Log in to FairShare</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium dark:text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium dark:text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <button type="submit" className="mt-2 rounded-md bg-emerald-600 p-2 font-medium text-white hover:bg-emerald-700">
            Log in
          </button>
        </form>
        <p className="mt-4 text-center text-sm dark:text-zinc-400">
          Don't have an account? <Link to="/register" className="text-emerald-600 hover:underline">Register</Link>
        </p>
      </main>
    </div>
  );
}
