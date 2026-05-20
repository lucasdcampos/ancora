package process

import (
	"fmt"
	"net"
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
	
	logFile, err := os.OpenFile(filepath.Join(repoDir, "service.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	} else {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	if err := cmd.Start(); err != nil {
		if logFile != nil {
			logFile.Close()
		}
		return 0, fmt.Errorf("failed to start command: %w", err)
	}

	pgid, err := syscall.Getpgid(cmd.Process.Pid)
	if err != nil {
		cmd.Process.Kill()
		cmd.Wait()
		if logFile != nil {
			logFile.Close()
		}
		return 0, fmt.Errorf("failed to get pgid: %w", err)
	}

	go func() {
		cmd.Wait()
		if logFile != nil {
			logFile.Close()
		}
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
	
	logFile, err := os.OpenFile(filepath.Join(repoDir, "service.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err == nil {
		defer logFile.Close()
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	} else {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	return cmd.Run()
}

func (s *Supervisor) GetLogs(projectName string, lines int) (string, error) {
	logPath := filepath.Join(s.BaseDir, projectName, "service.log")
	
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		return "No logs available yet for this project.", nil
	}

	cmd := exec.Command("tail", "-n", fmt.Sprintf("%d", lines), logPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to tail logs: %w", err)
	}

	return string(output), nil
}

func (s *Supervisor) FindAvailablePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}
