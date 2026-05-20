package orchestrator

import (
	"encoding/json"
	"log"
	"os"
	"sync"
	"syscall"
	"time"

	"ancora/config"
	"ancora/git"
	"ancora/process"
	"ancora/security"
)

type ProjectState struct {
	CommitHash string `json:"commit_hash"`
	PGID       int    `json:"pgid"`
	Status     string `json:"status"`
}

type Runner struct {
	ConfigPath    string
	StatePath     string
	BaseDir       string
	Git           *git.Manager
	Supervisor    *process.Supervisor
	States        map[string]*ProjectState
	mu            sync.Mutex
	forceSync     chan struct{}
	EncryptionKey []byte
}

func NewRunner(configPath, statePath, baseDir string, encKey []byte) *Runner {
	r := &Runner{
		ConfigPath:    configPath,
		StatePath:     statePath,
		BaseDir:       baseDir,
		States:        make(map[string]*ProjectState),
		forceSync:     make(chan struct{}, 1),
		EncryptionKey: encKey,
	}
	r.loadState()
	return r
}

func (r *Runner) loadState() {
	if data, err := os.ReadFile(r.StatePath); err == nil {
		json.Unmarshal(data, &r.States)
	}
}

func (r *Runner) saveState() {
	if data, err := json.MarshalIndent(r.States, "", "  "); err == nil {
		os.WriteFile(r.StatePath, data, 0644)
	}
}

func (r *Runner) Start() {
	cfg, err := config.LoadConfig(r.ConfigPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	interval := cfg.IntervalSeconds
	if interval <= 0 {
		interval = 60
	}

	token := cfg.GithubToken
	if token != "" {
		dec, err := security.Decrypt(token, r.EncryptionKey)
		if err == nil {
			token = dec
		} else {
			log.Printf("Failed to decrypt initial github token: %v", err)
			token = ""
		}
	}

	r.Git = git.NewManager(r.BaseDir, token)
	r.Supervisor = process.NewSupervisor(r.BaseDir)

	log.Printf("Starting orchestrator. Interval: %ds", interval)

	r.runOnce(cfg)

	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	for {
		select {
		case <-ticker.C:
			r.triggerRun()
		case <-r.forceSync:
			r.triggerRun()
		}
	}
}

func (r *Runner) triggerRun() {
	cfg, err := config.LoadConfig(r.ConfigPath)
	if err != nil {
		log.Printf("Error reloading config: %v", err)
		return
	}
	
	token := cfg.GithubToken
	if token != "" {
		dec, err := security.Decrypt(token, r.EncryptionKey)
		if err == nil {
			token = dec
		} else {
			log.Printf("Failed to decrypt reloaded github token: %v", err)
			token = ""
		}
	}

	r.Git.Token = token
	r.runOnce(cfg)
}

func (r *Runner) TriggerSync() {
	select {
	case r.forceSync <- struct{}{}:
	default:
	}
}

func (r *Runner) StopProject(name string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if state, exists := r.States[name]; exists {
		if state.PGID > 0 {
			log.Printf("[%s] API requested stop. Stopping PGID %d", name, state.PGID)
			r.Supervisor.Stop(state.PGID)
			state.PGID = 0
		}
		state.Status = "crashed" // Used if they stop it manually
		r.saveState()
	}
}

func (r *Runner) RestartProject(name string) {
	r.mu.Lock()
	if state, exists := r.States[name]; exists {
		if state.PGID > 0 {
			log.Printf("[%s] API requested restart. Stopping PGID %d", name, state.PGID)
			r.Supervisor.Stop(state.PGID)
			state.PGID = 0
		}
		state.CommitHash = ""
		state.Status = "deploying"
		r.saveState()
	}
	r.mu.Unlock()
	r.TriggerSync()
}

func (r *Runner) GetState(name string) *ProjectState {
	r.mu.Lock()
	defer r.mu.Unlock()
	if state, exists := r.States[name]; exists {
		return &ProjectState{
			CommitHash: state.CommitHash,
			PGID:       state.PGID,
			Status:     state.Status,
		}
	}
	return nil
}

func (r *Runner) GetLogs(name string, lines int) (string, error) {
	return r.Supervisor.GetLogs(name, lines)
}

func (r *Runner) updateStatus(name, status, hash string, pgid int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if state, exists := r.States[name]; exists {
		if status != "" {
			state.Status = status
		}
		if hash != "" {
			state.CommitHash = hash
		}
		if pgid >= 0 {
			state.PGID = pgid
		}
		r.saveState()
	}
}

func (r *Runner) runOnce(cfg *config.Config) {
	// Initialize states & remove missing projects from states
	r.mu.Lock()
	stateChanged := false
	
	activeProjects := make(map[string]bool)
	for _, proj := range cfg.Projects {
		activeProjects[proj.Name] = true
		if _, exists := r.States[proj.Name]; !exists {
			r.States[proj.Name] = &ProjectState{Status: "disabled"}
			stateChanged = true
		}
	}

	for name, state := range r.States {
		if !activeProjects[name] {
			if state.PGID > 0 {
				log.Printf("[%s] Project removed from config. Stopping PGID %d", name, state.PGID)
				r.Supervisor.Stop(state.PGID)
			}
			delete(r.States, name)
			stateChanged = true
		}
	}

	if stateChanged {
		r.saveState()
	}
	r.mu.Unlock()

	for _, proj := range cfg.Projects {
		r.mu.Lock()
		state := r.States[proj.Name]
		if state == nil {
			r.mu.Unlock()
			continue
		}

		if !proj.Enabled {
			if state.PGID > 0 {
				log.Printf("[%s] Project disabled. Stopping PGID %d", proj.Name, state.PGID)
				r.Supervisor.Stop(state.PGID)
				state.PGID = 0
				stateChanged = true
			}
			if state.Status != "disabled" {
				state.Status = "disabled"
				stateChanged = true
			}
			if stateChanged {
				r.saveState()
			}
			r.mu.Unlock()
			continue
		}

		// Check if process is still alive
		if state.PGID > 0 {
			if err := syscall.Kill(-state.PGID, 0); err != nil && err != syscall.EPERM {
				log.Printf("[%s] Process group PGID %d died unexpectedly.", proj.Name, state.PGID)
				state.PGID = 0
				state.Status = "crashed"
				stateChanged = true
			} else if state.Status != "online" && state.Status != "deploying" {
				state.Status = "online"
				stateChanged = true
			}
		}

		commitHash := state.CommitHash
		pgid := state.PGID
		status := state.Status

		if stateChanged {
			r.saveState()
			stateChanged = false
		}
		r.mu.Unlock()

		log.Printf("[%s] Syncing...", proj.Name)

		if err := r.Git.EnsureRepo(proj.Name, proj.RepoURL, proj.Branch); err != nil {
			log.Printf("[%s] Error ensuring repo: %v", proj.Name, err)
			r.updateStatus(proj.Name, "crashed", "", -1)
			continue
		}

		if err := r.Git.Fetch(proj.Name); err != nil {
			log.Printf("[%s] Error fetching: %v", proj.Name, err)
			r.updateStatus(proj.Name, "crashed", "", -1)
			continue
		}

		hash, err := r.Git.GetLatestCommitHash(proj.Name, proj.Branch)
		if err != nil {
			log.Printf("[%s] Error getting latest hash: %v", proj.Name, err)
			continue
		}

		// A crashed service should not continue to operate, the user can try to redeploy it or wait until there is a new commit.
		if hash == commitHash && status == "crashed" {
			log.Printf("[%s] Project is crashed and hash has not changed. Skipping until manual restart or new commit.", proj.Name)
			continue
		}

		if hash != commitHash || pgid == 0 {
			log.Printf("[%s] New update detected (or first run/restart). Deploying hash %s...", proj.Name, hash)
			
			r.updateStatus(proj.Name, "deploying", "", -1)

			if err := r.Git.ResetToCommit(proj.Name, hash); err != nil {
				log.Printf("[%s] Error resetting to commit: %v", proj.Name, err)
				r.updateStatus(proj.Name, "crashed", hash, 0)
				continue
			}

			if pgid > 0 {
				log.Printf("[%s] Stopping old process PGID %d", proj.Name, pgid)
				r.Supervisor.Stop(pgid)
			}
			
			// ensure we track pgid=0 during build
			r.updateStatus(proj.Name, "deploying", hash, 0)

			if proj.BuildCommand != "" {
				log.Printf("[%s] Running build command...", proj.Name)
				if err := r.Supervisor.RunBuild(proj.Name, proj.BuildCommand, proj.EnvVars); err != nil {
					log.Printf("[%s] Build failed: %v", proj.Name, err)
					r.updateStatus(proj.Name, "crashed", hash, 0)
					continue
				}
			}

			newPgid := 0
			if proj.DeployCommand != "" {
				log.Printf("[%s] Starting deploy command...", proj.Name)
				newPgid, err = r.Supervisor.Start(proj.Name, proj.DeployCommand, proj.EnvVars)
				if err != nil {
					log.Printf("[%s] Deploy failed: %v", proj.Name, err)
					r.updateStatus(proj.Name, "crashed", hash, 0)
					continue
				}
				log.Printf("[%s] Started successfully with PGID %d", proj.Name, newPgid)
			}

			r.updateStatus(proj.Name, "online", hash, newPgid)
		} else {
			log.Printf("[%s] Up to date.", proj.Name)
		}
	}
}
