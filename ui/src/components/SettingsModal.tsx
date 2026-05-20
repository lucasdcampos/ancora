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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-slate-800">Global Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">GitHub PAT (Personal Access Token)</label>
            <input 
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Set securely (Optional)"
            />
            <p className="mt-1.5 text-xs text-slate-500">Required for cloning private repositories. Stored securely using AES-256 GCM encryption.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Git Poll Interval (seconds)</label>
            <input 
              type="number" 
              value={interval} 
              onChange={(e) => setIntervalVal(parseInt(e.target.value))} 
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              min="5"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 font-medium transition-colors shadow-sm">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
