import osu from "node-os-utils";

const cpu = osu.cpu;

export interface WaitCpuOptions {
  threshold?: number;
  duration?: number;
  interval?: number;
  onProgress?: (message: string) => void;
}

export async function waitCpu({
  threshold = 80,
  duration = 3,
  interval = 3,
  onProgress,
}: WaitCpuOptions = {}): Promise<void> {
  let lowCPUStart: number | null = null;
  let lastLogTime = 0;

  while (true) {
    const cpuUsage = await cpu.usage();
    const now = Date.now();

    if (cpuUsage < threshold) {
      if (!lowCPUStart) {
        lowCPUStart = now;
        onProgress?.(
          `CPU usage at ${cpuUsage.toFixed(
            1
          )}% - below threshold, monitoring for stability...`
        );
      } else {
        const elapsed = (now - lowCPUStart) / 1000;
        if (elapsed >= duration) {
          onProgress?.(
            `CPU has been below ${threshold}% for ${duration} seconds. Ready to execute.`
          );
          return;
        } else if (onProgress && now - lastLogTime > 10000) {
          lastLogTime = now;
          onProgress(
            `CPU at ${cpuUsage.toFixed(1)}% - stable for ${elapsed.toFixed(
              0
            )}/${duration} seconds...`
          );
        }
      }
    } else {
      if (lowCPUStart && onProgress) {
        onProgress(
          `CPU usage at ${cpuUsage.toFixed(
            1
          )}% - exceeded threshold, resetting timer.`
        );
      } else if (onProgress && now - lastLogTime > 10000) {
        lastLogTime = now;
        onProgress(
          `CPU at ${cpuUsage.toFixed(
            1
          )}% - waiting for it to drop below ${threshold}%...`
        );
      }
      lowCPUStart = null;
    }

    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }
}

export default waitCpu;
