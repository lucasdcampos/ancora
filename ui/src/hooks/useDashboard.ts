import { useState, useEffect, useCallback } from 'react'
import type { Config, Metrics, Project } from '../types'
import * as api from '../api/client'
import { useToast } from './useToast'

export function useDashboard(onLogout: () => void) {
  const [config, setConfig] = useState<Config | null>(null)
  const [metrics, setMetrics] = useState<Metrics[]>([])
  const { toast, showSuccess, showError } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [confData, metricsData] = await Promise.all([
        api.fetchConfig(),
        api.fetchMetrics()
      ])
      setConfig(confData)
      setMetrics(metricsData)
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        onLogout()
      } else {
        console.error('Failed to fetch data', err)
      }
    }
  }, [onLogout])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 3000)
    return () => clearInterval(timer)
  }, [fetchData])

  const handleRestart = async (name: string) => {
    try {
      await api.projectAction(name, 'restart')
      showSuccess(`Redeployed ${name} successfully`)
      fetchData()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const saveConfig = async (newConf: Config) => {
    try {
      await api.updateConfig(newConf)
      showSuccess('Configuration updated successfully')
      fetchData()
      return true
    } catch (err: any) {
      showError(err.message)
      return false
    }
  }

  const toggleProject = async (name: string) => {
    if (!config) return
    const updatedProjects = config.projects.map(p => 
      p.name === name ? { ...p, enabled: !p.enabled } : p
    )
    await saveConfig({ ...config, projects: updatedProjects })
  }

  const deleteProject = async (name: string) => {
    if (!config) return
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return
    const updatedProjects = config.projects.filter(p => p.name !== name)
    await saveConfig({ ...config, projects: updatedProjects })
  }

  const saveProject = async (proj: Project, originalName: string | null) => {
    if (!config) return false
    let updatedProjects = [...(config.projects || [])]

    if (originalName) {
      updatedProjects = updatedProjects.map(p => p.name === originalName ? proj : p)
    } else {
      if (updatedProjects.find(p => p.name === proj.name)) {
        showError(`Project with name "${proj.name}" already exists`)
        return false
      }
      updatedProjects.push(proj)
    }

    return await saveConfig({ ...config, projects: updatedProjects })
  }

  const updateGlobalSettings = async (token: string, interval: number) => {
    if (!config) return false
    return await saveConfig({ ...config, github_token: token, interval_seconds: interval })
  }

  return {
    config,
    metrics,
    toast,
    handleRestart,
    toggleProject,
    deleteProject,
    saveProject,
    updateGlobalSettings,
    handleLogout: api.logout,
    refresh: fetchData
  }
}
