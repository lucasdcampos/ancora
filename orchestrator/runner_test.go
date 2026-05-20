package orchestrator

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"ancora/config"
	"ancora/git"
	"ancora/process"
)

func setupDummyRepo(t *testing.T, dir string) string {
	repoPath := filepath.Join(dir, "dummy-repo")
	err := os.MkdirAll(repoPath, 0755)
	if err != nil {
		t.Fatal(err)
	}

	// Initialize git repo with 'master' branch explicitly
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

	err = os.WriteFile(filepath.Join(repoPath, "script.sh"), []byte("echo v1"), 0644)
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

func TestOrchestratorLifecycle(t *testing.T) {
	tempDir := t.TempDir()

	// 1. Setup Dummy Remote
	repoURL := setupDummyRepo(t, tempDir)

	// 2. Setup Config
	configPath := filepath.Join(tempDir, "config.json")
	baseDir := filepath.Join(tempDir, "projects")

	cfg := &config.Config{
		IntervalSeconds: 1,
		Projects: []config.Project{
			{
				Name:          "test-app",
				RepoURL:       repoURL,
				Branch:        "master",
				BuildCommand:  "echo 'building'",
				DeployCommand: "sleep 100", // Long running process to keep PGID alive
				Enabled:       true,
			},
		},
	}

	data, err := json.Marshal(cfg)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		t.Fatal(err)
	}

	// 3. Initialize Runner
	runner := NewRunner(configPath, filepath.Join(tempDir, "state.json"), baseDir, make([]byte, 32))
	runner.Git = git.NewManager(baseDir, "")
	runner.Supervisor = process.NewSupervisor(baseDir)

	// 4. Test Initial Run
	runner.SyncOnce()

	state := runner.States["test-app"]
	if state == nil || state.PGID == 0 {
		t.Fatal("Expected project to be running with a valid PGID")
	}
	pgid1 := state.PGID

	// Verify process is running
	if err := syscall.Kill(pgid1, 0); err != nil {
		t.Fatalf("Expected process %d to be running: %v", pgid1, err)
	}

	// 5. Test Update Run (New Commit)
	repoPath := filepath.Join(tempDir, "dummy-repo")
	err = os.WriteFile(filepath.Join(repoPath, "script.sh"), []byte("echo v2"), 0644)
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command("git", "commit", "-am", "v2")
	cmd.Dir = repoPath
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to create new commit: %v", err)
	}

	runner.SyncOnce()

	pgid2 := state.PGID
	if pgid2 == pgid1 {
		t.Fatal("Expected a new PGID after new commit redeployment")
	}

	// Verify old process is killed (give it a tiny bit of time to die)
	time.Sleep(100 * time.Millisecond)
	if err := syscall.Kill(pgid1, 0); err == nil {
		t.Fatalf("Expected old process %d to be killed", pgid1)
	}

	// Verify new process is running
	if err := syscall.Kill(pgid2, 0); err != nil {
		t.Fatalf("Expected new process %d to be running: %v", pgid2, err)
	}

	// 6. Test Disable Project
	cfg.Projects[0].Enabled = false
	data, _ = json.Marshal(cfg)
	os.WriteFile(configPath, data, 0644)
	runner.SyncOnce()

	if state.PGID != 0 {
		t.Fatalf("Expected PGID to be 0 after disabling, got %d", state.PGID)
	}

	// Verify process was killed
	time.Sleep(100 * time.Millisecond)
	if err := syscall.Kill(pgid2, 0); err == nil {
		t.Fatalf("Expected process %d to be killed after disabling", pgid2)
	}
}
