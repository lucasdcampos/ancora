import { useState } from 'react'
import { useDashboard } from './hooks/useDashboard'
import type { Project } from './types'
import ProjectCard from './components/ProjectCard'
import ProjectModal from './components/ProjectModal'
import ProjectLogsModal from './components/ProjectLogsModal'
import SettingsModal from './components/SettingsModal'
import Toast from './components/Toast'

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const {
    config,
    metrics,
    toast,
    handleRestart,
    toggleProject,
    deleteProject,
    saveProject,
    updateGlobalSettings,
    handleLogout
  } = useDashboard(onLogout)

  const [showSettings, setShowSettings] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedProjectForLogs, setSelectedProjectForLogs] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined)

  const projects = config?.projects || []
  const getMetric = (name: string) => metrics.find(m => m.name === name)

  const onLogoutClick = async () => {
    await handleLogout()
    onLogout()
  }

  const openAddProject = () => {
    setEditingProject(undefined)
    setShowProjectModal(true)
  }

  const openEditProject = (p: Project) => {
    setEditingProject(p)
    setShowProjectModal(true)
  }

  const openLogs = (name: string) => {
    setSelectedProjectForLogs(name)
    setShowLogsModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 relative">
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Ancora ⚓
          </h1>
          <div className="space-x-3 flex">
            <button onClick={openAddProject} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 font-medium shadow-sm transition-colors">Add Project</button>
            <button onClick={() => setShowSettings(true)} className="rounded bg-white border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors">Settings</button>
            <button onClick={onLogoutClick} className="rounded bg-white border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors">Logout</button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map(p => (
            <ProjectCard
              key={p.name}
              project={p}
              metrics={getMetric(p.name)}
              onRestart={handleRestart}
              onToggle={toggleProject}
              onEdit={openEditProject}
              onDelete={deleteProject}
              onShowLogs={openLogs}
            />
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-lg border-2 border-dashed border-slate-300">
              <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              <p className="text-lg font-medium text-slate-700 mb-1">No projects configured</p>
              <p className="text-sm">Click "Add Project" to deploy your first application.</p>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          initialToken={config?.github_token || ''}
          initialInterval={config?.interval_seconds || 60}
          onSave={updateGlobalSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          initialData={editingProject}
          onSave={saveProject}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {showLogsModal && selectedProjectForLogs && (
        <ProjectLogsModal
          projectName={selectedProjectForLogs}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </div>
  )
}
