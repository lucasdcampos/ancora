package config

import (
	"encoding/json"
	"os"
)

type Project struct {
	Name          string `json:"name"`
	RepoURL       string `json:"repo_url"`
	Branch        string `json:"branch"`
	BuildCommand  string `json:"build_command"`
	DeployCommand string `json:"deploy_command"`
	EnvVars       string `json:"env_vars"`
	Enabled       bool   `json:"enabled"`
}

type Config struct {
	GithubToken      string    `json:"github_token"`
	AdminCredentials string    `json:"admin_credentials"`
	IntervalSeconds  int       `json:"interval_seconds"`
	Projects         []Project `json:"projects"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func SaveConfig(path string, cfg *Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
