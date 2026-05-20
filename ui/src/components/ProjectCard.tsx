import type { Project, Metrics } from "../types"

interface ProjectCardProps {
  project: Project
  metrics?: Metrics
  onRestart: (name: string) => void
  onToggle: (name: string) => void
  onEdit: (p: Project) => void
  onDelete: (name: string) => void
}

export default function ProjectCard({ project: p, metrics: m, onRestart, onToggle, onEdit, onDelete }: ProjectCardProps) {
  const isRunning = m && m.pgid > 0
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          {p.name}
          {!p.enabled ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">Disabled</span>
          ) : m?.status === 'online' ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse"></span> Online
            </span>
          ) : m?.status === 'crashed' ? (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span> Crashed
            </span>
          ) : m?.status === 'deploying' ? (
            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1.5 animate-pulse"></span> Deploying
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">Unknown</span>
          )}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => onEdit(p)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
          <button onClick={() => onDelete(p.name)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
        </div>
      </div>

      <div className="mb-4 text-sm text-slate-600 flex-grow">
        <p className="truncate"><span className="font-medium">Repo:</span> <a href={p.repo_url} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">{p.repo_url}</a></p>
        <p><span className="font-medium">Branch:</span> {p.branch}</p>
        {m && m.commit_hash && m.commit_hash !== "Not running" && (
          <p><span className="font-medium">Git Hash:</span> <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{m.commit_hash.substring(0, 7)}</code></p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded bg-slate-50 p-4 border border-slate-100">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CPU Usage</p>
          <p className="text-xl font-bold text-slate-800">
            {isRunning ? m.cpu_percent.toFixed(1) + '%' : '0.0%'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Memory (RSS)</p>
          <p className="text-xl font-bold text-slate-800">
            {isRunning ? formatBytes(m.memory_rss) : '0 MB'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onToggle(p.name)}
          className={`flex-1 rounded py-2 text-sm font-medium transition-colors shadow-sm ${
            p.enabled 
              ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {p.enabled ? 'Disable' : 'Enable'}
        </button>
        
        {p.enabled && (
          <button
            onClick={() => onRestart(p.name)}
            className="flex-1 rounded bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            Redeploy
          </button>
        )}
      </div>
    </div>
  )
}
