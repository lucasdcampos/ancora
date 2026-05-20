package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"ancora/api"
	"ancora/config"
	"ancora/orchestrator"
)

type TestEnv struct {
	TempDir    string
	ConfigPath string
	StatePath  string
	BaseDir    string
	Runner     *orchestrator.Runner
	Server     *api.Server
	Mux        http.Handler
}

func SetupTestEnv(t *testing.T) *TestEnv {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")
	statePath := filepath.Join(tempDir, "state.json")
	baseDir := filepath.Join(tempDir, "projects")

	err := os.MkdirAll(baseDir, 0755)
	if err != nil {
		t.Fatal(err)
	}

	cfg := &config.Config{
		AdminCredentials: "", // Empty for bootstrap
		IntervalSeconds:  1,
	}
	if err := config.SaveConfig(configPath, cfg); err != nil {
		t.Fatal(err)
	}

	encKey := make([]byte, 32)
	runner := orchestrator.NewRunner(configPath, statePath, baseDir, encKey)
	runner.Initialize() // Initialize default git and supervisor
	
	server := api.NewServer(configPath, runner, nil, encKey)
	mux := server.SetupRouter()

	return &TestEnv{
		TempDir:    tempDir,
		ConfigPath: configPath,
		StatePath:  statePath,
		BaseDir:    baseDir,
		Runner:     runner,
		Server:     server,
		Mux:        mux,
	}
}

func setupDummyRepo(t *testing.T, dir string) string {
	repoPath := filepath.Join(dir, "dummy-repo")
	err := os.MkdirAll(repoPath, 0755)
	if err != nil {
		t.Fatal(err)
	}

	cmds := [][]string{
		{"git", "init", "-b", "master"},
		{"git", "config", "user.name", "Test"},
		{"git", "config", "user.email", "test@test.com"},
	}
	for _, c := range cmds {
		cmd := exec.Command(c[0], c[1:]...)
		cmd.Dir = repoPath
		if err := cmd.Run(); err != nil {
			t.Fatalf("Failed to run %v: %v", c, err)
		}
	}

	err = os.WriteFile(filepath.Join(repoPath, "script.sh"), []byte("#!/bin/sh\necho 'hello'\nsleep 100"), 0755)
	if err != nil {
		t.Fatal(err)
	}

	cmds = [][]string{
		{"git", "add", "."},
		{"git", "commit", "-m", "Initial commit"},
	}
	for _, c := range cmds {
		cmd := exec.Command(c[0], c[1:]...)
		cmd.Dir = repoPath
		if err := cmd.Run(); err != nil {
			t.Fatalf("Failed to run %v: %v", c, err)
		}
	}

	return "file://" + repoPath
}

func TestFullFlow(t *testing.T) {
	env := SetupTestEnv(t)
	repoURL := setupDummyRepo(t, env.TempDir)

	// 1. Bootstrap
	authPayload, _ := json.Marshal(api.AuthRequest{Password: "secure-password-123"})
	req := httptest.NewRequest("POST", "/api/auth/bootstrap", bytes.NewBuffer(authPayload))
	w := httptest.NewRecorder()
	env.Mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Bootstrap failed: %d %s", w.Code, w.Body.String())
	}

	var sessionCookie *http.Cookie
	for _, cookie := range w.Result().Cookies() {
		if cookie.Name == "ancora_session" {
			sessionCookie = cookie
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("Session cookie not found")
	}

	// 2. Add Project via Config
	newCfg := &config.Config{
		AdminCredentials: "", // Will be kept from existing
		IntervalSeconds:  1,
		Projects: []config.Project{
			{
				Name:          "test-app",
				RepoURL:       repoURL,
				Branch:        "master",
				DeployCommand: "sh script.sh",
				Enabled:       true,
			},
		},
	}
	cfgPayload, _ := json.Marshal(newCfg)
	req = httptest.NewRequest("PUT", "/api/config", bytes.NewBuffer(cfgPayload))
	req.AddCookie(sessionCookie)
	w = httptest.NewRecorder()
	env.Mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to update config: %d %s", w.Code, w.Body.String())
	}

	// 3. Trigger Orchestrator Sync
	env.Runner.SyncOnce()

	// 4. Verify Project is running
	state := env.Runner.GetState("test-app")
	if state == nil {
		t.Fatal("Project state not found")
	}
	if state.Status != "online" {
		t.Fatalf("Expected status online, got %s", state.Status)
	}
	if state.PGID == 0 {
		t.Fatal("Expected non-zero PGID")
	}

	// 5. Stop Project via API
	req = httptest.NewRequest("POST", "/api/projects/test-app/stop", nil)
	req.AddCookie(sessionCookie)
	w = httptest.NewRecorder()
	env.Mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to stop project: %d %s", w.Code, w.Body.String())
	}

	state = env.Runner.GetState("test-app")
	if state.PGID != 0 {
		t.Fatalf("Expected PGID 0 after stop, got %d", state.PGID)
	}

	// 6. Restart Project via API
	req = httptest.NewRequest("POST", "/api/projects/test-app/restart", nil)
	req.AddCookie(sessionCookie)
	w = httptest.NewRecorder()
	env.Mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to restart project: %d %s", w.Code, w.Body.String())
	}

	// Sync again to process the restart request
	env.Runner.SyncOnce()

	state = env.Runner.GetState("test-app")
	if state.Status != "online" || state.PGID == 0 {
		t.Fatalf("Expected project to be online after restart, got status=%s, pgid=%d", state.Status, state.PGID)
	}

	// Clean up processes
	if state.PGID > 0 {
		env.Runner.Supervisor.Stop(state.PGID)
	}
}
