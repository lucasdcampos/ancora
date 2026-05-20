package git

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Manager struct {
	BaseDir string
	Token   string
}

func NewManager(baseDir, token string) *Manager {
	return &Manager{BaseDir: baseDir, Token: token}
}

func (m *Manager) EnsureRepo(projectName, repoURL, branch string) error {
	repoDir := filepath.Join(m.BaseDir, projectName)

	if _, err := os.Stat(repoDir); os.IsNotExist(err) {
		authURL := m.getAuthURL(repoURL)
		cmd := exec.Command("git", "clone", "-b", branch, authURL, repoDir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	}

	return nil
}

func (m *Manager) Fetch(projectName string) error {
	repoDir := filepath.Join(m.BaseDir, projectName)
	cmd := exec.Command("git", "fetch", "origin")
	cmd.Dir = repoDir
	return cmd.Run()
}

func (m *Manager) GetLatestCommitHash(projectName, branch string) (string, error) {
	repoDir := filepath.Join(m.BaseDir, projectName)
	cmd := exec.Command("git", "rev-parse", fmt.Sprintf("origin/%s", branch))
	cmd.Dir = repoDir

	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return strings.TrimSpace(out.String()), nil
}

func (m *Manager) ResetToCommit(projectName, commitHash string) error {
	repoDir := filepath.Join(m.BaseDir, projectName)
	cmd := exec.Command("git", "reset", "--hard", commitHash)
	cmd.Dir = repoDir
	return cmd.Run()
}

func (m *Manager) getAuthURL(repoURL string) string {
	if m.Token == "" {
		return repoURL
	}
	if strings.HasPrefix(repoURL, "https://") {
		return strings.Replace(repoURL, "https://", fmt.Sprintf("https://%s@", m.Token), 1)
	}
	return repoURL
}
