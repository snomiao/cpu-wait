#!/usr/bin/env node

const osu = require('node-os-utils');
const { spawn } = require('child_process');
const { program } = require('commander');
const packageJson = require('./package.json');

const cpu = osu.cpu;

async function waitForLowCPU(threshold, duration, interval, verbose) {
  let lowCPUStart = null;
  let lastLogTime = 0;

  if (verbose) {
    console.log(`Waiting for CPU usage < ${threshold}% for ${duration} seconds...`);
  }

  while (true) {
    const cpuUsage = await cpu.usage();
    const now = Date.now();

    if (cpuUsage < threshold) {
      if (!lowCPUStart) {
        lowCPUStart = now;
        if (verbose) {
          console.log(`CPU usage at ${cpuUsage.toFixed(1)}% - below threshold, monitoring for stability...`);
        }
      } else {
        const elapsed = (now - lowCPUStart) / 1000;
        if (elapsed >= duration) {
          if (verbose) {
            console.log(`CPU has been below ${threshold}% for ${duration} seconds. Ready to execute.`);
          }
          return true;
        } else if (verbose && now - lastLogTime > 10000) {
          lastLogTime = now;
          console.log(`CPU at ${cpuUsage.toFixed(1)}% - stable for ${elapsed.toFixed(0)}/${duration} seconds...`);
        }
      }
    } else {
      if (lowCPUStart && verbose) {
        console.log(`CPU usage at ${cpuUsage.toFixed(1)}% - exceeded threshold, resetting timer.`);
      } else if (verbose && now - lastLogTime > 10000) {
        lastLogTime = now;
        console.log(`CPU at ${cpuUsage.toFixed(1)}% - waiting for it to drop below ${threshold}%...`);
      }
      lowCPUStart = null;
    }

    await new Promise(resolve => setTimeout(resolve, interval * 1000));
  }
}

async function main() {
  program
    .version(packageJson.version)
    .description('Wait for CPU load to drop below a threshold before executing a command')
    .option('-t, --threshold <percent>', 'CPU usage threshold percentage', parseFloat, 80)
    .option('-d, --duration <seconds>', 'Duration CPU must stay below threshold', parseFloat, 60)
    .option('-i, --interval <seconds>', 'Check interval in seconds', parseFloat, 5)
    .option('-v, --verbose', 'Show detailed progress messages', false)
    .option('-q, --quiet', 'Suppress all output except errors', false)
    .argument('<command...>', 'Command to execute after CPU threshold is met')
    .parse(process.argv);

  const options = program.opts();
  const commandArgs = program.args;

  if (commandArgs.length === 0) {
    console.error('Error: No command specified');
    program.help();
    process.exit(1);
  }

  // Validate options
  if (options.threshold < 0 || options.threshold > 100) {
    console.error('Error: Threshold must be between 0 and 100');
    process.exit(1);
  }

  if (options.duration < 0) {
    console.error('Error: Duration must be a positive number');
    process.exit(1);
  }

  if (options.interval <= 0) {
    console.error('Error: Interval must be a positive number');
    process.exit(1);
  }

  try {
    if (!options.quiet) {
      console.log(`CPU Wait: Monitoring CPU usage...`);
      console.log(`Settings: threshold=${options.threshold}%, duration=${options.duration}s, interval=${options.interval}s`);
    }

    await waitForLowCPU(
      options.threshold,
      options.duration,
      options.interval,
      options.verbose && !options.quiet
    );

    if (!options.quiet) {
      console.log(`Executing: ${commandArgs.join(' ')}`);
    }

    // Execute the command
    const [command, ...args] = commandArgs;
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    child.on('error', (error) => {
      console.error(`Failed to execute command: ${error.message}`);
      process.exit(1);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`Process terminated by signal: ${signal}`);
        process.exit(1);
      }
      process.exit(code || 0);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nCPU Wait: Interrupted by user');
  process.exit(130);
});

if (require.main === module) {
  main();
}