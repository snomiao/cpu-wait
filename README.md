# cpu-wait

A CLI tool that waits for CPU load to drop below a threshold before executing commands. Perfect for running resource-intensive tasks only when your system has available capacity.

## Installation

### Using npx (no installation required)
```bash
npx cpu-wait <command>
```

### Global installation
```bash
npm install -g cpu-wait
```

### Local installation
```bash
npm install cpu-wait
```

## Usage

### Basic usage
Wait for CPU usage to drop below 80% for 60 seconds, then run a command:
```bash
npx cpu-wait -- npm run build
```

### Custom threshold
Wait for CPU usage below 50%:
```bash
npx cpu-wait --threshold 50 -- make all
```

### Custom duration
Wait for CPU to be low for 30 seconds:
```bash
npx cpu-wait --duration 30 -- ./heavy-process.sh
```

### Verbose mode
See detailed progress:
```bash
npx cpu-wait --verbose -- python train_model.py
```

### Quiet mode
Suppress all output except errors:
```bash
npx cpu-wait --quiet -- rsync -av source/ dest/
```

## Options

- `-t, --threshold <percent>` - CPU usage threshold percentage (default: 80)
- `-d, --duration <seconds>` - Duration CPU must stay below threshold (default: 60)
- `-i, --interval <seconds>` - Check interval in seconds (default: 5)
- `-v, --verbose` - Show detailed progress messages
- `-q, --quiet` - Suppress all output except errors
- `-h, --help` - Display help
- `-V, --version` - Display version

## Examples

### Build project when CPU is available
```bash
npx cpu-wait -- npm run build
```

### Run backup when system is idle
```bash
npx cpu-wait --threshold 30 --duration 120 -- ./backup.sh
```

### Process video files when CPU is low
```bash
npx cpu-wait --threshold 50 -- ffmpeg -i input.mp4 -c:v libx264 output.mp4
```

### Chain multiple commands
```bash
npx cpu-wait -- bash -c "npm test && npm run build && npm run deploy"
```

### Use in npm scripts
Add to your `package.json`:
```json
{
  "scripts": {
    "build:when-idle": "npx cpu-wait -- npm run build",
    "test:when-idle": "npx cpu-wait --threshold 70 -- npm test"
  }
}
```

## How it works

1. The tool monitors CPU usage at regular intervals (default: every 5 seconds)
2. When CPU usage drops below the threshold (default: 80%), it starts a timer
3. If CPU stays below the threshold for the specified duration (default: 60 seconds), the command executes
4. If CPU exceeds the threshold during the wait period, the timer resets
5. The command runs with the same environment variables and working directory

## Use Cases

- **CI/CD pipelines**: Run builds when agents have capacity
- **Batch processing**: Process data when servers are idle
- **Development**: Run heavy tasks without interrupting other work
- **Server maintenance**: Schedule intensive operations during low-usage periods
- **Resource management**: Prevent system overload by queuing tasks

## Requirements

- Node.js >= 14.0.0
- Works on Linux, macOS, and Windows

## License

MIT

## Author

snomiao

## Contributing

Issues and pull requests are welcome at [GitHub](https://github.com/snomiao/cpu-wait)