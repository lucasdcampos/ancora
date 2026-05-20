package api

import (
	"encoding/json"
	"net/http"

	"ancora/config"
	"ancora/metrics"
	"ancora/security"

	"github.com/go-chi/chi/v5"
)

type SafeConfig struct {
	GithubToken     string           `json:"github_token"`
	IntervalSeconds int              `json:"interval_seconds"`
	Projects        []config.Project `json:"projects"`
}

func (s *Server) HandleGetConfig(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.LoadConfig(s.ConfigPath)
	if err != nil {
		http.Error(w, "Failed to load config", http.StatusInternalServerError)
		return
	}

	maskedToken := ""
	if cfg.GithubToken != "" {
		maskedToken = "********"
	}

	safe := SafeConfig{
		GithubToken:     maskedToken,
		IntervalSeconds: cfg.IntervalSeconds,
		Projects:        cfg.Projects,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(safe)
}

func (s *Server) HandlePutConfig(w http.ResponseWriter, r *http.Request) {
	var input SafeConfig
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	cfg, err := config.LoadConfig(s.ConfigPath)
	if err != nil {
		http.Error(w, "Failed to load config", http.StatusInternalServerError)
		return
	}

	if input.GithubToken != "********" {
		if input.GithubToken == "" {
			cfg.GithubToken = ""
		} else {
			enc, err := security.Encrypt(input.GithubToken, s.EncryptionKey)
			if err != nil {
				http.Error(w, "Encryption failed", http.StatusInternalServerError)
				return
			}
			cfg.GithubToken = enc
		}
	}

	cfg.IntervalSeconds = input.IntervalSeconds
	cfg.Projects = input.Projects

	if err := config.SaveConfig(s.ConfigPath, cfg); err != nil {
		http.Error(w, "Failed to save config", http.StatusInternalServerError)
		return
	}

	// Trigger the orchestrator to apply changes
	s.Runner.TriggerSync()

	w.WriteHeader(http.StatusOK)
}

func (s *Server) HandleRestartProject(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	s.Runner.RestartProject(name)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) HandleStopProject(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	s.Runner.StopProject(name)
	w.WriteHeader(http.StatusOK)
}

type ProjectMetrics struct {
	Name       string  `json:"name"`
	PGID       int     `json:"pgid"`
	CPUPercent float64 `json:"cpu_percent"`
	MemoryRSS  uint64  `json:"memory_rss"`
	CommitHash string  `json:"commit_hash"`
	Status     string  `json:"status"`
}

func (s *Server) HandleGetMetrics(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.LoadConfig(s.ConfigPath)
	if err != nil {
		http.Error(w, "Failed to load config", http.StatusInternalServerError)
		return
	}

	var results []ProjectMetrics

	for _, proj := range cfg.Projects {
		state := s.Runner.GetState(proj.Name)
		if state == nil {
			results = append(results, ProjectMetrics{
				Name:       proj.Name,
				CommitHash: "Not running",
				Status:     "disabled",
			})
			continue
		}

		cpu := 0.0
		var mem uint64 = 0
		if state.PGID > 0 {
			usage, err := metrics.GetUsage(state.PGID)
			if err == nil {
				cpu = usage.CPUPercent
				mem = usage.MemoryRSS
			}
		}

		results = append(results, ProjectMetrics{
			Name:       proj.Name,
			PGID:       state.PGID,
			CPUPercent: cpu,
			MemoryRSS:  mem,
			CommitHash: state.CommitHash,
			Status:     state.Status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
