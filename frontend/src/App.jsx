import { useEffect, useState } from 'react'
import api from '@/lib/api'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/v1/health')
      .then((response) => setHealth(response.data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
          FairShare
        </p>
        <h1 className="mt-2 text-3xl font-bold">Phase 0 Scaffold</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track shared expenses and settle up easily.
        </p>

        <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-500">Backend health</p>
          {health && (
            <p className="mt-1 text-sm text-emerald-600">
              {health.status} — {health.message}
            </p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          {!health && !error && (
            <p className="mt-1 text-sm text-zinc-500">Checking...</p>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
