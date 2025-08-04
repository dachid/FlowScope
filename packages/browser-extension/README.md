# FlowScope Browser Extension

FlowScope browser extension for debugging LLM chains in web-based playgrounds.

## Features

- **Multi-Platform Support**: Works with ChatGPT, Claude, Bard, Hugging Face, and Replicate
- **Real-Time Tracing**: Captures LLM interactions as they happen
- **API Interception**: Monitors network requests to LLM APIs
- **Debug Panel**: Comprehensive interface for analyzing traces
- **Export Functionality**: Save traces for offline analysis
- **Server Integration**: Connects to FlowScope backend for persistent storage

## Installation

### Chrome/Chromium

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `packages/browser-extension` folder
4. The FlowScope extension should now appear in your extensions

### Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `packages/browser-extension` folder

## Usage

### 1. Connect to FlowScope Server

1. Click the FlowScope extension icon in your browser toolbar
2. Enter your FlowScope server URL (default: `http://localhost:3001`)
3. Click "Connect"

### 2. Start Tracing

1. Navigate to a supported LLM platform (ChatGPT, Claude, etc.)
2. Click the FlowScope extension icon
3. Click "Start Tracing"
4. Interact with the LLM platform normally

### 3. View Debug Panel

1. Click "Open Debug Panel" in the extension popup
2. Browse captured traces in the sidebar
3. Click on any trace to view detailed information

### 4. Export Traces

1. Click "Export Traces" in the extension popup or debug panel
2. A JSON file with all traces will be downloaded

## Supported Platforms

- **ChatGPT** (`chat.openai.com`)
- **Claude** (`claude.ai`)
- **Google Bard** (`bard.google.com`)
- **Hugging Face** (`huggingface.co`)
- **Replicate** (`replicate.com`)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Page      │    │  Content Script │    │ Background      │
│                 │    │                 │    │ Service Worker  │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Injected    │ │◄──►│ │ Platform    │ │◄──►│ │ Trace       │ │
│ │ Script      │ │    │ │ Integration │ │    │ │ Management  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ API Calls       │    │ DOM Monitoring  │    │ FlowScope       │
│ Interception    │    │ & Events        │    │ Server          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development

### Building

```bash
cd packages/browser-extension
npm run build
```

### Packaging

```bash
# On Unix/macOS
npm run package

# On Windows
npm run package-win
```

### Testing

1. Load the extension in developer mode
2. Navigate to a supported platform
3. Open browser developer tools
4. Check console for FlowScope logs
5. Test tracing functionality

## Configuration

The extension stores configuration in Chrome's sync storage:

- `serverUrl`: FlowScope server endpoint
- User preferences are automatically synced across devices

## Privacy & Security

- The extension only monitors specified LLM platforms
- No data is collected without explicit user consent
- All traces are stored locally by default
- Server communication is optional and user-controlled

## Troubleshooting

### Extension Not Loading
- Check that all required files are present
- Verify manifest.json is valid
- Enable developer mode in browser

### Traces Not Appearing
- Ensure tracing is started via extension popup
- Check that you're on a supported platform
- Verify FlowScope server connection

### Debug Panel Empty
- Refresh the panel using the "Refresh" button
- Check browser console for error messages
- Ensure traces have been captured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on all supported platforms
5. Submit a pull request

## License

MIT License - see LICENSE file for details
