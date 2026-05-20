import { useState } from 'react'
import { useDashboard } from './hooks/useDashboard'
import { useTheme } from './hooks/useTheme'
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
  const { theme, toggleTheme } = useTheme()

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 transition-colors duration-200">
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ancora
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l.707.707M6.343 17.657l.707.707M16.95 16.95l.707.707M7.636 7.636l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={onLogoutClick} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Logout">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={openAddProject} 
              className="ml-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              New Project
            </button>
          </div>
        </header>

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
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to launch?</p>
              <p className="text-sm max-w-xs text-center opacity-80 mb-6">Create your first project to start monitoring and deploying automatically.</p>
              <button onClick={openAddProject} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                Get Started
              </button>
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
