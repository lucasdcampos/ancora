import { useState } from 'react'

interface AuthProps {
  needsBootstrap: boolean
  onLogin: (password: string) => Promise<{ success: boolean, error?: string }>
}

export default function Auth({ needsBootstrap, onLogin }: AuthProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await onLogin(password)
    if (!res.success) {
      setError(res.error || 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-slate-800">
          Ancora {needsBootstrap ? 'Setup' : 'Login'}
        </h1>
        
        {needsBootstrap && (
          <p className="mb-4 text-sm text-slate-600 text-center">
            Welcome to Ancora! Please set your admin password to continue.
          </p>
        )}

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (needsBootstrap ? 'Set Password & Login' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  )
}
