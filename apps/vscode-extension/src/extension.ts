import * as vscode from 'vscode';

// Core Services
import { DesktopAppClient } from './services/desktopAppClient';
import { TraceCaptureService } from './services/traceCapture';
import { WorkspaceManager } from './services/workspaceManager';

// Providers
import { FlowScopeTreeProvider } from './providers/treeProvider';
import { TraceLensProvider } from './providers/traceLensProvider';
import { TraceDecorationProvider } from './providers/traceDecorationProvider';

// Commands and UI
import { CommandHandler } from './commands/commandHandler';
import { FallbackUIProvider, StatusBarProvider, NotificationManager } from './ui/fallbackUI';

// Global state
let desktopAppClient: DesktopAppClient;
let traceCaptureService: TraceCaptureService;
let workspaceManager: WorkspaceManager;
let treeProvider: FlowScopeTreeProvider;
let traceLensProvider: TraceLensProvider;
let traceDecorationProvider: TraceDecorationProvider;
let commandHandler: CommandHandler;
let fallbackUIProvider: FallbackUIProvider;
let statusBarProvider: StatusBarProvider;
let notificationManager: NotificationManager;

export async function activate(context: vscode.ExtensionContext) {
	console.log('🔍 FlowScope extension activating...');

	try {
		// Initialize notification manager first
		notificationManager = NotificationManager.getInstance();

		// Initialize core services
		console.log('Initializing core services...');
		desktopAppClient = new DesktopAppClient();
		
		// Create API client wrapper for services that need it
		const apiClient = {
			getTraces: () => traceCaptureService?.getTraces() || Promise.resolve([]),
			isTracingActive: () => traceCaptureService?.isCapturingTraces() || false,
			isDesktopAppConnected: () => desktopAppClient?.isConnected || false,
			setWorkspace: (path: string) => desktopAppClient?.setWorkspace(path) || Promise.resolve(),
			startTracing: () => traceCaptureService?.startCapture() || Promise.resolve(false),
			stopTracing: () => traceCaptureService?.stopCapture() || Promise.resolve(),
			clearTraces: () => traceCaptureService?.clearTraces() || Promise.resolve(),
			exportTraces: (path: string, format: string) => traceCaptureService?.exportTraces(path, format) || Promise.resolve(),
			showTraceDetails: (traceId: string) => desktopAppClient?.showTraceDetails(traceId) || Promise.resolve(),
			openTracesView: () => desktopAppClient?.openTracesView() || Promise.resolve(),
			showLineTraces: (file: string, line: number, traces: any[]) => 
				desktopAppClient?.showLineTraces(file, line, traces) || Promise.resolve(),
			// Additional FlowScopeApiClient methods
			health: () => desktopAppClient?.health() || Promise.reject(new Error('Not connected')),
			addTrace: (trace: any) => desktopAppClient?.addTrace(trace) || Promise.resolve(),
			updateTrace: (id: string, trace: any) => Promise.resolve(),
			getTrace: (id: string) => Promise.resolve(null),
			deleteTrace: (id: string) => Promise.resolve(),
			getWorkspace: () => Promise.resolve(null),
			createWorkspace: (workspace: any) => Promise.resolve(null),
			updateWorkspace: (id: string, workspace: any) => Promise.resolve(),
			deleteWorkspace: (id: string) => Promise.resolve(),
			getPrompts: () => Promise.resolve([]),
			createPrompt: (prompt: any) => Promise.resolve(null),
			updatePrompt: (id: string, prompt: any) => Promise.resolve()
		};

		// Initialize workspace manager
		workspaceManager = new WorkspaceManager(desktopAppClient);
		
		// Initialize trace capture service
		traceCaptureService = new TraceCaptureService(desktopAppClient);
		
		// Initialize providers
		console.log('Initializing providers...');
		treeProvider = new FlowScopeTreeProvider(desktopAppClient);
		traceLensProvider = new TraceLensProvider(desktopAppClient);
		traceDecorationProvider = new TraceDecorationProvider(desktopAppClient);
		
		// Initialize UI components
		console.log('Initializing UI components...');
		fallbackUIProvider = new FallbackUIProvider(context.extensionUri, desktopAppClient);
		statusBarProvider = new StatusBarProvider();
		
		// Initialize command handler
		commandHandler = new CommandHandler(
			desktopAppClient,
			traceCaptureService,
			workspaceManager
		);

		// Register all providers
		console.log('Registering providers...');
		
		// Tree view provider
		context.subscriptions.push(
			vscode.window.registerTreeDataProvider('flowscopeExplorer', treeProvider)
		);

		// WebView provider for fallback UI
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				FallbackUIProvider.viewType,
				fallbackUIProvider
			)
		);

		// CodeLens provider
		context.subscriptions.push(
			vscode.languages.registerCodeLensProvider(
				{ scheme: 'file', pattern: '**/*.{py,js,ts,jsx,tsx}' },
				traceLensProvider
			)
		);

		// Register commands
		console.log('Registering commands...');
		commandHandler.registerCommands(context);

		// Legacy commands for backward compatibility
		context.subscriptions.push(
			vscode.commands.registerCommand('flowscope.refreshTraces', () => {
				treeProvider.refresh();
				fallbackUIProvider.updateTraces(traceCaptureService.getTracesSync());
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('flowscope.openTrace', (traceId: string) => {
				commandHandler.registerCommands(context);
				vscode.commands.executeCommand('flowscope.showTraceDetails', traceId);
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('flowscope.connectToDesktop', async () => {
				await vscode.commands.executeCommand('flowscope.connectDesktopApp');
			})
		);

		// Quick access command
		context.subscriptions.push(
			vscode.commands.registerCommand('flowscope.showQuickPick', async () => {
				const { QuickPickProvider } = await import('./ui/fallbackUI');
				QuickPickProvider.showMainMenu();
			})
		);

		// Panel toggle command
		context.subscriptions.push(
			vscode.commands.registerCommand('flowscope.togglePanel', () => {
				vscode.commands.executeCommand('workbench.view.extension.flowscope');
			})
		);

		// Add to context subscriptions for proper cleanup
		context.subscriptions.push(
			traceCaptureService,
			workspaceManager,
			statusBarProvider,
			notificationManager
		);

		// Set up event listeners
		setupEventListeners();

		// Try to connect to desktop app on startup
		console.log('Attempting to connect to desktop app...');
		try {
			const connected = await desktopAppClient.connect();
			if (connected) {
				console.log('✅ Connected to FlowScope desktop app');
				notificationManager.showSuccess('Connected to FlowScope Desktop App!');
				statusBarProvider.updateStatus('stopped', true);
				fallbackUIProvider.updateDesktopAppStatus(true);
				treeProvider.refresh();
			} else {
				console.log('📱 FlowScope desktop app not available, using fallback UI');
				statusBarProvider.updateStatus('stopped', false);
				fallbackUIProvider.updateDesktopAppStatus(false);
			}
		} catch (error) {
			console.error('Failed to connect to desktop app:', error);
			statusBarProvider.updateStatus('stopped', false);
			fallbackUIProvider.updateDesktopAppStatus(false);
		}

		console.log('🚀 FlowScope extension activated successfully!');
		
		// Show welcome message for first-time users
		const hasShownWelcome = context.globalState.get('flowscope.welcomeShown', false);
		if (!hasShownWelcome) {
			showWelcomeMessage(context);
		}

	} catch (error) {
		console.error('❌ Failed to activate FlowScope extension:', error);
		vscode.window.showErrorMessage(
			`Failed to activate FlowScope: ${error}`,
			'View Logs'
		).then(action => {
			if (action === 'View Logs') {
				vscode.commands.executeCommand('workbench.action.showLogs');
			}
		});
	}
}

/**
 * Set up event listeners for real-time updates
 */
function setupEventListeners(): void {
	// Listen for trace capture events
	if (traceCaptureService) {
		traceCaptureService.onTraceCaptured((traces) => {
			// Update all UI components
			fallbackUIProvider?.updateTraces(traces);
			treeProvider?.refresh();
  traceDecorationProvider?.updateDecorations();			// Show notification for significant trace events
			if (traces.length > 0 && traces.length % 10 === 0) {
				notificationManager?.showTraceCaptured(traces.length);
			}
		});

		traceCaptureService.onTracingStatusChanged((isActive) => {
			statusBarProvider?.updateStatus(isActive ? 'tracing' : 'stopped', desktopAppClient?.isConnected || false);
			fallbackUIProvider?.updateTracingStatus(isActive);
		});
	}

	// Listen for desktop app connection changes
	if (desktopAppClient) {
		desktopAppClient.onConnectionChanged((isConnected) => {
			statusBarProvider?.updateStatus(
				traceCaptureService?.isCapturingTraces() ? 'tracing' : 'stopped',
				isConnected
			);
			fallbackUIProvider?.updateDesktopAppStatus(isConnected);
			
			if (isConnected) {
				notificationManager?.showSuccess('Desktop app connected!');
			} else {
				notificationManager?.showWarning('Desktop app disconnected. Using fallback UI.');
			}
		});
	}

	// Listen for workspace changes
	vscode.workspace.onDidChangeWorkspaceFolders(() => {
		workspaceManager?.dispose();
		// Reinitialize workspace manager would happen here
	});

	// Listen for configuration changes
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('flowscope')) {
			console.log('FlowScope configuration changed, refreshing...');
			// Refresh components that depend on configuration
			traceCaptureService?.refreshConfiguration();
			traceDecorationProvider?.refreshConfiguration();
		}
	});

	// Listen for active editor changes to update decorations
	vscode.window.onDidChangeActiveTextEditor(() => {
		traceDecorationProvider?.updateDecorations();
	});

	// Listen for text document changes to update inline metrics
	vscode.workspace.onDidChangeTextDocument((event) => {
		// Debounce updates to avoid excessive processing
		setTimeout(() => {
			traceLensProvider?.refresh();
		}, 500);
	});
}

/**
 * Show welcome message for new users
 */
async function showWelcomeMessage(context: vscode.ExtensionContext): Promise<void> {
	const choice = await vscode.window.showInformationMessage(
		'🔍 Welcome to FlowScope! Ready to debug your LLM applications?',
		'Setup Workspace',
		'Install Desktop App',
		'Start Tracing',
		'Later'
	);

	switch (choice) {
		case 'Setup Workspace':
			vscode.commands.executeCommand('flowscope.setupWorkspace');
			break;
		case 'Install Desktop App':
			vscode.commands.executeCommand('flowscope.installDesktopApp');
			break;
		case 'Start Tracing':
			vscode.commands.executeCommand('flowscope.startTracing');
			break;
	}

	if (choice !== 'Later') {
		context.globalState.update('flowscope.welcomeShown', true);
	}
}

export function deactivate() {
	console.log('🔍 FlowScope extension deactivating...');
	
	try {
		// Dispose of all services and providers
		if (desktopAppClient) {
			desktopAppClient.disconnect();
		}
		
		if (traceCaptureService) {
			traceCaptureService.dispose();
		}
		
		if (workspaceManager) {
			workspaceManager.dispose();
		}
		
		if (statusBarProvider) {
			statusBarProvider.dispose();
		}
		
		if (notificationManager) {
			notificationManager.dispose();
		}

		console.log('✅ FlowScope extension deactivated successfully');
	} catch (error) {
		console.error('❌ Error during FlowScope deactivation:', error);
	}
}
