# Ancora ⚓

Ancora is a high-density, self-hosted deployment orchestrator and monitor. It allows you to manage multiple Git-based services from a single, modern dashboard with real-time metrics, automated port management, and integrated logs.

<img width="1128" height="579" alt="image" src="https://github.com/user-attachments/assets/97fd5c62-2ee3-4bcd-b460-6021170ef711" />

## ✨ Features

- **🌓 Modern UI with Dark Mode:** A premium, high-density dashboard that respects system theme preferences.
- **🚀 Automated Deployments:** Syncs with your Git repositories and automatically builds/re-deploys when new commits are detected.
- **📡 Smart Port Management:** Automatically detects free ports and injects them into your service's environment as `PORT`.
- **📊 Real-time Monitoring:** Live CPU and Memory usage tracking for all active processes.
- **📜 Integrated Logs:** Real-time access to service logs (build and runtime) directly from the dashboard.
- **🔐 Secure by Design:** Encrypts sensitive data (like GitHub PATs) at rest using AES-256 GCM.
- **🖼️ Customization:** Choose custom icons for each project to keep your dashboard organized.

## 🚀 Getting Started

### Prerequisites

- **Go** (1.21 or higher)
- **Node.js & npm** (for building the frontend)
- **Git** (installed on the host system)

### Building the Project

Ancora bundles its frontend into a single Go binary for easy distribution.

1. **Build the Frontend:**
   ```bash
   cd ui
   npm install
   npm run build
   cd ..
   ```

2. **Build the Go Binary:**
   ```bash
   go build -o ancora main.go
   ```

### Running Ancora

Simply run the compiled binary:

```bash
./ancora
```

On the first run, Ancora will:
1. Generate a secure encryption key (`ancora.key`).
2. Create a default `config.json`.
3. Start the web server on port `8080`.

### Initial Setup

When you first access the dashboard (usually at `http://localhost:8080`), you will be prompted to set an **Admin Password**. This password will be required for all future logins.

## 🛠️ Configuration

Ancora stores its state and configuration in the following files:
- `config.json`: Project definitions, intervals, and GitHub tokens.
- `state.json`: Internal tracking of deployment hashes and process IDs.
- `ancora.key`: AES key for encrypting secrets. **Do not delete this!**
- `projects/`: Directory where your repositories are cloned and built.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
