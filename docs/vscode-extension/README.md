# FlowScope VS Code Extension

> **Note**: This extension is currently in development and not yet published to the VS Code marketplace.

## Overview

The FlowScope VS Code extension provides seamless integration between VS Code and FlowScope Desktop, enabling:

- **Automatic trace detection** when debugging in VS Code
- **Jump-to-code** functionality from FlowScope Desktop
- **Real-time trace synchronization** between VS Code and desktop app
- **Inline performance annotations** during development

## Features

### 🔗 Automatic Desktop Connection
- Detects running FlowScope Desktop instances
- Establishes WebSocket connection for real-time communication
- Shows connection status in VS Code status bar

### 🎯 Jump-to-Code
- Click traces in FlowScope Desktop to jump to corresponding code in VS Code
- Automatically opens files and navigates to specific lines
- Highlights relevant code sections during trace exploration

### 📊 Inline Trace Information
- Performance metrics displayed as inline decorations
- Error highlighting for failed traces
- Token usage and timing information in hover tooltips

### 🚀 Development Workflow Integration
- Start/stop tracing sessions directly from VS Code
- Automatic workspace detection and session creation
- Context menu integration for quick trace actions

## Installation

### Option 1: From VS Code Marketplace (Coming Soon)
```bash
# Will be available as:
code --install-extension flowscope.flowscope-vscode
```

### Option 2: Manual Installation (Development)
1. Clone the FlowScope repository
2. Navigate to the VS Code extension directory
3. Install dependencies and build:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```
4. Install the extension in VS Code:
   ```bash
   code --install-extension .
   ```

## Configuration

The extension can be configured through VS Code settings:

```json
{
  "flowscope.desktopPort": 31847,
  "flowscope.autoConnect": true,
  "flowscope.highlightTraces": true
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `flowscope.desktopPort` | `31847` | Port for FlowScope Desktop API server |
| `flowscope.autoConnect` | `true` | Automatically connect to FlowScope Desktop on startup |
| `flowscope.highlightTraces` | `true` | Highlight code lines during trace execution |

## Usage

### 1. Ensure FlowScope Desktop is Running
The extension requires FlowScope Desktop to be running and accessible on localhost.

### 2. Connect to Desktop
- The extension will automatically attempt to connect if `autoConnect` is enabled
- Manually connect using the command palette: `FlowScope: Connect to Desktop`
- Check connection status in the status bar (bottom-left)

### 3. Start Tracing
- Use the command palette: `FlowScope: Start Tracing Session`
- Or right-click in the explorer/editor and select "Start FlowScope Tracing"

### 4. Navigate Between Code and Traces
- Click traces in FlowScope Desktop to jump to corresponding VS Code locations
- Use `FlowScope: Open Desktop` to bring the desktop app to focus

## Commands

| Command | Description |
|---------|-------------|
| `FlowScope: Connect to Desktop` | Establish connection to FlowScope Desktop |
| `FlowScope: Start Tracing Session` | Begin a new tracing session |
| `FlowScope: Stop Tracing Session` | End the current tracing session |
| `FlowScope: Open Desktop` | Bring FlowScope Desktop window to focus |

## Development

### Architecture

The extension communicates with FlowScope Desktop through:

1. **HTTP API** (port 31847 by default):
   - Health checks and connection establishment
   - Session management
   - Trace data exchange

2. **WebSocket Connection**:
   - Real-time bidirectional communication
   - Jump-to-code requests from desktop
   - Trace synchronization events

### Message Protocol

#### Desktop → VS Code Messages

```typescript
// Jump to specific code location
{
  type: 'jump-to-code',
  payload: {
    filePath: '/path/to/file.js',
    line: 42,
    column: 10,
    traceId: 'trace-123'
  }
}

// Synchronize trace state
{
  type: 'sync-trace',
  payload: {
    traceId: 'trace-123',
    action: 'highlight' | 'focus' | 'annotate' | 'clear',
    data: { /* action-specific data */ }
  }
}
```

#### VS Code → Desktop Messages

```typescript
// Extension ready handshake
{
  type: 'extension-ready',
  payload: {
    extensionVersion: '0.1.0',
    workspacePath: '/path/to/workspace'
  }
}

// Workspace change notification
{
  type: 'workspace-changed',
  payload: {
    workspacePath: '/new/workspace/path',
    sessionId: 'session-456'
  }
}
```

### Building and Testing

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Publishing

```bash
# Install vsce (VS Code Extension manager)
npm install -g @vscode/vsce

# Package
vsce package

# Publish to marketplace
vsce publish
```

## Troubleshooting

### Connection Issues

**Problem**: Extension shows "Not connected to FlowScope Desktop"

**Solutions**:
1. Ensure FlowScope Desktop is running
2. Check if the desktop app is listening on the correct port (default: 31847)
3. Verify firewall settings allow localhost connections
4. Try manually connecting: `Cmd/Ctrl+Shift+P` → "FlowScope: Connect to Desktop"

### Jump-to-Code Not Working

**Problem**: Clicking traces in desktop doesn't open files in VS Code

**Solutions**:
1. Ensure both VS Code and FlowScope Desktop are running
2. Check WebSocket connection status in VS Code output panel
3. Verify file paths are accessible from VS Code workspace
4. Try refreshing the connection

### Performance Issues

**Problem**: Extension causes VS Code to slow down

**Solutions**:
1. Disable `flowscope.highlightTraces` if using large codebases
2. Reduce trace session frequency
3. Check for memory leaks in extension output

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/flowscope/flowscope-desktop)
- 🐛 [Report Issues](https://github.com/flowscope/flowscope-desktop/issues)
- 💬 [Discussions](https://github.com/flowscope/flowscope-desktop/discussions)
