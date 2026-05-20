import { useEffect, useState, useRef } from "react"
import { fetchLogs } from "../api/client"

interface ProjectLogsModalProps {
  projectName: string
  onClose: () => void
}

export default function ProjectLogsModal({ projectName, onClose }: ProjectLogsModalProps) {
  const [logs, setLogs] = useState<string>('Loading logs...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const preRef = useRef<HTMLPreElement>(null)

  const loadLogs = async () => {
    try {
      const data = await fetchLogs(projectName)
      setLogs(data || 'No logs found.')
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 3000)
    return () => clearInterval(interval)
  }, [projectName])

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] rounded-xl bg-slate-900 text-slate-100 flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold">Service Logs: {projectName}</h2>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-mono">Live (3s)</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 p-0 overflow-hidden relative">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-red-900/10">
              <div className="text-center">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <pre 
              ref={preRef}
              className="h-full w-full overflow-auto p-6 font-mono text-sm leading-relaxed selection:bg-blue-500/30"
            >
              {logs}
            </pre>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/30 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Showing last 100 lines
          </div>
          <button 
            onClick={loadLogs}
            className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center space-x-1"
          >
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Now</span>
          </button>
        </div>
      </div>
    </div>
  )
}
