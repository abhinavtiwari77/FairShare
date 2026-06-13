import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Welcome, {user?.fullName}!</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your email is {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
