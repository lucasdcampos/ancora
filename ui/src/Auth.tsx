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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-10 shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>
        
        <h1 className="mb-2 text-3xl font-black text-center text-slate-900 dark:text-white tracking-tight">
          Ancora
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
          {needsBootstrap ? 'Setup your admin password' : 'Enter your password to continue'}
        </p>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-2 px-1">Access Token</label>
            <input
              type="password"
              className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••••••"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (needsBootstrap ? 'Complete Setup' : 'Unlock Dashboard')}
          </button>
        </form>
      </div>
    </div>
  )
}
