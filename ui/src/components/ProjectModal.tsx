import { useState } from "react"
import type { Project } from "../types"
import { PROJECT_ICONS, ProjectIcon } from "./Icons"

interface ProjectModalProps {
  initialData?: Project
  onSave: (proj: Project, originalName: string | null) => Promise<boolean>
  onClose: () => void
}

export default function ProjectModal({ initialData, onSave, onClose }: ProjectModalProps) {
  const [form, setForm] = useState<Project>(initialData || {
    name: '', repo_url: '', branch: 'master', build_command: '', deploy_command: '', env_vars: '', enabled: true, icon: 'default'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await onSave(form, initialData?.name || null)) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto transition-all">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-2xl my-auto border border-slate-200 dark:border-slate-700">
        <h2 className="mb-8 text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ProjectIcon name={form.icon} className="w-6 h-6 text-white" />
          </div>
          {initialData ? 'Edit Project' : 'New Project'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Project Icon</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PROJECT_ICONS).map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setForm({...form, icon: iconName})}
                  className={`p-3 rounded-2xl transition-all border-2 ${
                    form.icon === iconName 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
                >
                  <ProjectIcon name={iconName} className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Project Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!!initialData} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white disabled:opacity-50" placeholder="my-service" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Branch</label>
              <input required type="text" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white" placeholder="master" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Repository URL</label>
            <input required type="text" value={form.repo_url} onChange={e => setForm({...form, repo_url: e.target.value})} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white" placeholder="https://github.com/user/repo" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Build Command <span className="opacity-50 font-medium lowercase italic">(Optional)</span></label>
            <input type="text" value={form.build_command} onChange={e => setForm({...form, build_command: e.target.value})} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white" placeholder="npm install && npm run build" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Deploy Command</label>
            <input required type="text" value={form.deploy_command} onChange={e => setForm({...form, deploy_command: e.target.value})} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white" placeholder="./server or npm start" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Environment Variables <span className="opacity-50 font-medium lowercase italic">(.env)</span></label>
            <textarea rows={3} value={form.env_vars} onChange={e => setForm({...form, env_vars: e.target.value})} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all dark:text-white" placeholder="PORT=8080" />
          </div>
          {!initialData && (
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-900">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable project immediately</span>
            </label>
          )}

          <div className="flex justify-end gap-3 mt-10">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
