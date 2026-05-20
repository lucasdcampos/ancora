# Ancora ⚓ - Project Blueprint (Professional Version)

Ancora is a "Personal PaaS" designed to manage web applications as pure Linux processes on a VPS. It provides a "Vercel-like" experience for self-hosting with a single-binary installation.

## 1. Vision & Development Philosophy
- **Single Binary**: Backend (Go) + Optional Frontend (React) compiled into one executable.
- **Pure Process Management**: Manages applications as native OS processes using Process Groups.
- **Resource Efficiency**: Low overhead, suitable for 512MB/1GB RAM VPS.
- **Config-First**: The `config.json` is the source of truth and must remain human-readable and editable manually.
- **Optional Frontend**: The application must be fully functional via `config.json` alone; the UI is a management layer.

## 2. Technical Stack
- **Backend**: Go (Golang) - chosen for single-binary builds and efficient process management.
- **Frontend**: React (Vite, TailwindCSS, Shadcn/UI).
- **Persistence**: 
    - `config.json`: All project and security settings.
    - `state.json`: Transient runtime metrics (CPU, RAM, PIDs).
    - `SQLite`: *Optional* for non-critical historical data (logs/audit).

## 3. Core Architecture & Modules

### 3.1. Primary Configuration (`config.json`)
The application is driven by a central JSON file containing:
- `github_token`: Global PAT for Git operations.
- `admin_credentials`: Hashed credentials for API access.
- `interval_seconds`: Global sync frequency.
- `projects`: A list of objects containing:
    - `name`: Unique service identifier.
    - `repo_url`: GitHub HTTPS URL.
    - `branch`: The specific branch to track (e.g., `master`).
    - `build_command`: Command to run before deployment.
    - `deploy_command`: Long-running command to start the service.
    - `env_vars`: Raw string of environment variables (written to `.env` file).
    - `enabled`: Boolean to activate/deactivate the project.

### 3.2. The Orchestrator (Go)
- **Git Manager**: Uses system `git` to clone/fetch/reset repositories.
- **Process Supervisor**: Starts services in isolated Process Groups (`syscall.Setpgid`) for tree-wide termination.
- **Resource Monitor**: Sums CPU/RAM from `/proc` for all processes in a group.
- **Lifecycle**: Periodically polls Git -> Detects Change -> Writes `.env` -> Runs Build -> Kills old PGID -> Starts new PGID.

### 3.3. The API (REST)
- Provides endpoints to manipulate `config.json` and send signals (`restart`, `stop`) to the Orchestrator.
- Secure session management using HttpOnly Cookies.

## 4. Key Security Features
- **HttpOnly Cookies**: Prevents session hijacking.
- **Password Hashing**: Secure storage for admin credentials.
- **Process Isolation**: Prevents orphaned subprocesses from leaking resources.
- **Bootstrap Mode**: Automatic admin account creation on first access.

## 5. User Experience
- **Installation**: Download bin -> `chmod +x` -> `./ancora`.
- **Interface**: High-density management with collapsible cards, real-time resource badges, and integrated terminal logs.
