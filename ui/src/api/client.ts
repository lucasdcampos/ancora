import type { Config } from "../types"

export async function fetchConfig(): Promise<Config> {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch config')
  return res.json()
}

export async function updateConfig(config: Config): Promise<void> {
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  if (!res.ok) throw new Error(await res.text() || 'Failed to update config')
}

export async function fetchMetrics(): Promise<any[]> {
  const res = await fetch('/api/metrics')
  if (!res.ok) throw new Error('Failed to fetch metrics')
  return res.json()
}

export async function projectAction(name: string, action: 'restart' | 'stop'): Promise<void> {
  const res = await fetch(`/api/projects/${name}/${action}`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text() || `Failed to ${action}`)
}

export async function fetchLogs(name: string): Promise<string> {
  const res = await fetch(`/api/projects/${name}/logs`)
  if (!res.ok) throw new Error(await res.text() || 'Failed to fetch logs')
  return res.text()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}
