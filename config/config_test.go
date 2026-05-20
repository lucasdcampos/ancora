package config

import (
	"path/filepath"
	"testing"
)

func TestConfig(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")

	cfg := &Config{
		GithubToken:     "test-token",
		IntervalSeconds: 30,
		Projects: []Project{
			{
				Name:    "app1",
				RepoURL: "https://github.com/org/app1",
				Branch:  "main",
				Enabled: true,
			},
		},
	}

	err := SaveConfig(configPath, cfg)
	if err != nil {
		t.Fatalf("SaveConfig failed: %v", err)
	}

	loaded, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	if loaded.GithubToken != cfg.GithubToken {
		t.Errorf("Expected token %s, got %s", cfg.GithubToken, loaded.GithubToken)
	}
	if len(loaded.Projects) != 1 || loaded.Projects[0].Name != "app1" {
		t.Error("Projects not loaded correctly")
	}

	// Test missing file
	_, err = LoadConfig(filepath.Join(tempDir, "missing.json"))
	if err == nil {
		t.Fatal("Expected error when loading missing config")
	}
}
