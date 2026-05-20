package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"ancora/api"
	"ancora/config"
	"ancora/orchestrator"
	"ancora/security"
)

//go:embed all:ui/dist
var uiEmbed embed.FS

func main() {
	configPath := "config.json"
	baseDir := "projects"
	apiPort := "8080" // Default API Port

	if err := os.MkdirAll(baseDir, 0755); err != nil {
		log.Fatalf("Failed to create projects dir: %v", err)
	}

	encryptionKey, err := security.GetOrGenerateKey("ancora.key")
	if err != nil {
		log.Fatalf("Failed to initialize encryption key: %v", err)
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		defaultConfig := &config.Config{
			IntervalSeconds: 60,
			Projects: []config.Project{
				{
					Name:          "demo-app",
					RepoURL:       "https://github.com/torvalds/linux", // Just as a safe dummy repo for initial config
					Branch:        "master",
					BuildCommand:  "echo 'building'",
					DeployCommand: "while true; do echo 'running'; sleep 5; done",
					Enabled:       false,
				},
			},
		}
		if err := config.SaveConfig(configPath, defaultConfig); err != nil {
			log.Fatalf("Failed to create default config: %v", err)
		}
		log.Println("Created default config.json.")
	}

	runner := orchestrator.NewRunner(configPath, "state.json", baseDir, encryptionKey)
	
	// Create sub filesystem for embedded ui/dist
	uiFS, err := fs.Sub(uiEmbed, "ui/dist")
	if err != nil {
		log.Fatalf("Failed to sub ui/dist filesystem: %v", err)
	}

	apiServer := api.NewServer(configPath, runner, http.FS(uiFS), encryptionKey)
	go apiServer.Start(apiPort)

	runner.Start()
}
