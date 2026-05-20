export interface Project {
  name: string
  repo_url: string
  branch: string
  build_command: string
  deploy_command: string
  env_vars: string
  enabled: boolean
  icon: string
}

export interface Metrics {
  name: string
  pgid: number
  cpu_percent: number
  memory_rss: number
  commit_hash: string
  status: string
  port: number
}

export interface Config {
  github_token: string
  interval_seconds: number
  projects: Project[]
}
