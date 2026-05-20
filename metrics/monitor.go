package metrics

import (
	"syscall"

	"github.com/shirou/gopsutil/v4/process"
)

type ResourceUsage struct {
	CPUPercent float64
	MemoryRSS  uint64
}

func GetUsage(pgid int) (ResourceUsage, error) {
	if pgid <= 0 {
		return ResourceUsage{}, nil
	}

	procs, err := process.Processes()
	if err != nil {
		return ResourceUsage{}, err
	}

	var usage ResourceUsage
	for _, p := range procs {
		p_pgid, err := syscall.Getpgid(int(p.Pid))
		if err != nil {
			continue
		}

		if p_pgid == pgid {
			cpu, err := p.CPUPercent()
			if err == nil {
				usage.CPUPercent += cpu
			}

			memInfo, err := p.MemoryInfo()
			if err == nil && memInfo != nil {
				usage.MemoryRSS += memInfo.RSS
			}
		}
	}

	return usage, nil
}
