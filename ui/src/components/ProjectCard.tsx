import type { Project, Metrics } from "../types"
import { ProjectIcon } from "./Icons"

interface ProjectCardProps {
  project: Project
  metrics?: Metrics
  onRestart: (name: string) => void
  onToggle: (name: string) => void
  onEdit: (p: Project) => void
  onDelete: (name: string) => void
  onShowLogs: (name: string) => void
}

export default function ProjectCard({ project: p, metrics: m, onRestart, onToggle, onEdit, onDelete, onShowLogs }: ProjectCardProps) {
  const isRunning = m && m.pgid > 0
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            <ProjectIcon name={p.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
              {p.name}
              {m && m.port > 0 && (
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-lg text-slate-500 dark:text-slate-400">
                  :{m.port}
                </span>
              )}
            </h2>
            {!p.enabled ? (
              <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">Disabled</span>
            ) : m?.status === 'online' ? (
              <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Online
              </span>
            ) : m?.status === 'crashed' ? (
              <span className="inline-flex items-center rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Crashed
              </span>
            ) : m?.status === 'deploying' ? (
              <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span> Deploying
              </span>
            ) : (
              <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">Unknown</span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => onEdit(p)} 
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="Edit Project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(p.name)} 
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete Project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="truncate opacity-90"><a href={p.repo_url} target="_blank" rel="noreferrer" className="hover:underline">{p.repo_url.replace('https://', '')}</a></p>
        </div>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="font-medium">{p.branch}</span>
          </div>
          {m && m.commit_hash && m.commit_hash !== "Not running" && (
            <code className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">
              {m.commit_hash.substring(0, 7)}
            </code>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">CPU Usage</p>
          <p className="text-xl font-black text-slate-800 dark:text-white">
            {isRunning ? m.cpu_percent.toFixed(1) + '%' : '0.0%'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Memory</p>
          <p className="text-xl font-black text-slate-800 dark:text-white">
            {isRunning ? formatBytes(m.memory_rss) : '0 MB'}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-auto">
        <button
          onClick={() => onShowLogs(p.name)}
          className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-700 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Logs
        </button>
        
        {p.enabled && (
          <button
            onClick={() => onRestart(p.name)}
            className="flex-1 rounded-xl bg-slate-900 dark:bg-white py-2.5 text-sm font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-slate-900/10 dark:shadow-white/5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Redeploy
          </button>
        )}

        <button
          onClick={() => onToggle(p.name)}
          className={`p-2.5 rounded-xl transition-all active:scale-95 border ${
            p.enabled 
              ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-100 dark:hover:border-red-900/30' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg shadow-emerald-500/20'
          }`}
          title={p.enabled ? "Disable Project" : "Enable Project"}
        >
          {p.enabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
