package process

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

type Supervisor struct {
	BaseDir string
}

func NewSupervisor(baseDir string) *Supervisor {
	return &Supervisor{BaseDir: baseDir}
}

func (s *Supervisor) Start(projectName, command, envVars string) (int, error) {
	if command == "" {
		return 0, nil
	}
	repoDir := filepath.Join(s.BaseDir, projectName)

	envPath := filepath.Join(repoDir, ".env")
	if envVars != "" {
		if err := os.WriteFile(envPath, []byte(envVars), 0644); err != nil {
			return 0, fmt.Errorf("failed to write .env: %w", err)
		}
	}

	cmd := exec.Command("sh", "-c", command)
	cmd.Dir = repoDir
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return 0, fmt.Errorf("failed to start command: %w", err)
	}

	pgid, err := syscall.Getpgid(cmd.Process.Pid)
	if err != nil {
		cmd.Process.Kill()
		cmd.Wait()
		return 0, fmt.Errorf("failed to get pgid: %w", err)
	}

	go func() {
		cmd.Wait()
	}()

	return pgid, nil
}

func (s *Supervisor) Stop(pgid int) error {
	if pgid <= 0 {
		return nil
	}
	err := syscall.Kill(-pgid, syscall.SIGKILL)
	if err != nil && err != syscall.ESRCH {
		return fmt.Errorf("failed to kill pgid %d: %w", pgid, err)
	}
	return nil
}

func (s *Supervisor) RunBuild(projectName, command, envVars string) error {
	if command == "" {
		return nil
	}
	repoDir := filepath.Join(s.BaseDir, projectName)

	envPath := filepath.Join(repoDir, ".env")
	if envVars != "" {
		if err := os.WriteFile(envPath, []byte(envVars), 0644); err != nil {
			return fmt.Errorf("failed to write .env: %w", err)
		}
	}

	cmd := exec.Command("sh", "-c", command)
	cmd.Dir = repoDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
