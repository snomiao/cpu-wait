#!/usr/bin/env node

import { spawn } from 'child_process';
import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { waitCpu } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')); // TODO: can be imported directly in future Node.js versions

async function main() {
  program
    .version(packageJson.version)
    .description('Wait for CPU load to drop below a threshold before executing a command')
    .option('-t, --threshold <percent>', 'CPU usage threshold percentage', parseFloat, 80)
    .option('-d, --duration <seconds>', 'Duration CPU must stay below threshold', parseFloat, 3)
    .option('-i, --interval <seconds>', 'Check interval in seconds', parseFloat, 3)
    .option('-v, --verbose', 'Show detailed progress messages', false)
    .option('-q, --quiet', 'Suppress all output except errors', false)
    .argument('[command...]', 'Command to execute after CPU threshold is met (optional)')
    .parse(process.argv);

  const options = program.opts();
  const commandArgs = program.args;

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

    await waitCpu({
      threshold: options.threshold,
      duration: options.duration,
      interval: options.interval,
      onProgress: options.verbose && !options.quiet ? (msg) => console.log(msg) : undefined
    });

    // If no command was specified, just exit successfully
    if (commandArgs.length === 0) {
      if (!options.quiet) {
        console.log(`CPU threshold met. No command specified, exiting.`);
      }
      process.exit(0);
    }

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

main();