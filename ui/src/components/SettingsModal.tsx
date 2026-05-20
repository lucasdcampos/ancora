import { useState } from "react"

interface SettingsModalProps {
  initialToken: string
  initialInterval: number
  onSave: (token: string, interval: number) => Promise<boolean>
  onClose: () => void
}

export default function SettingsModal({ initialToken, initialInterval, onSave, onClose }: SettingsModalProps) {
  const [token, setToken] = useState(initialToken)
  const [interval, setIntervalVal] = useState(initialInterval)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await onSave(token, interval)) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 transition-all">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
        <h2 className="mb-8 text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Settings
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">GitHub Token (PAT)</label>
            <input 
              type="password" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white"
              placeholder="••••••••••••••••"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 leading-relaxed italic">Used for private repos. Encrypted at rest with AES-256 GCM.</p>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Sync Interval (seconds)</label>
            <input 
              type="number" 
              value={interval} 
              onChange={(e) => setIntervalVal(parseInt(e.target.value))} 
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white"
              min="5"
            />
          </div>
          <div className="flex justify-end gap-3 mt-10">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Save Config</button>
          </div>
        </form>
      </div>
    </div>
  )

}
