import { useState } from "react"
import type { Project } from "../types"

interface ProjectModalProps {
  initialData?: Project
  onSave: (proj: Project, originalName: string | null) => Promise<boolean>
  onClose: () => void
}

export default function ProjectModal({ initialData, onSave, onClose }: ProjectModalProps) {
  const [form, setForm] = useState<Project>(initialData || {
    name: '', repo_url: '', branch: 'master', build_command: '', deploy_command: '', env_vars: '', enabled: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await onSave(form, initialData?.name || null)) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl my-auto">
        <h2 className="mb-6 text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">
          {initialData ? 'Edit Project' : 'Add New Project'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!!initialData} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="my-service" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Branch</label>
              <input required type="text" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="master" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Repository URL</label>
            <input required type="text" value={form.repo_url} onChange={e => setForm({...form, repo_url: e.target.value})} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="https://github.com/user/repo" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Build Command <span className="text-slate-400 font-normal">(Optional)</span></label>
            <input type="text" value={form.build_command} onChange={e => setForm({...form, build_command: e.target.value})} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="npm install && npm run build" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Deploy Command</label>
            <input required type="text" value={form.deploy_command} onChange={e => setForm({...form, deploy_command: e.target.value})} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="./server or npm start" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Environment Variables <span className="text-slate-400 font-normal">(.env format)</span></label>
            <textarea rows={4} value={form.env_vars} onChange={e => setForm({...form, env_vars: e.target.value})} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="PORT=8080&#10;NODE_ENV=production" />
          </div>
          {!initialData && (
            <div className="flex items-center mt-2 bg-slate-50 p-3 rounded border border-slate-200">
              <input id="enable-check" type="checkbox" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="enable-check" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">Enable project immediately</label>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancel</button>
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 font-medium transition-colors shadow-sm">
              {initialData ? 'Save Changes' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
