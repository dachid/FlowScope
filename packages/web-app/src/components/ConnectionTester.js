"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionTester = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const httpTest_1 = require("../utils/httpTest");
const useWebSocket_1 = require("../hooks/useWebSocket");
const debugger_1 = require("../store/debugger");
const ConnectionTester = () => {
    const [isRunning, setIsRunning] = (0, react_1.useState)(false);
    const [testResults, setTestResults] = (0, react_1.useState)([]);
    const { status, sendTrace } = (0, useWebSocket_1.useWebSocket)();
    const { currentSession, addSession } = (0, debugger_1.useDebuggerStore)();
    const updateTestResult = (name, status, message) => {
        setTestResults(prev => prev.map(test => test.name === name ? { ...test, status, message } : test));
    };
    const runTests = async () => {
        setIsRunning(true);
        setTestResults([
            { name: 'Backend Health Check', status: 'pending' },
            { name: 'HTTP Trace API', status: 'pending' },
            { name: 'WebSocket Connection', status: 'pending' },
            { name: 'Live Trace Streaming', status: 'pending' },
        ]);
        try {
            // Test 1: Backend Health Check
            const healthOk = await (0, httpTest_1.checkBackendHealth)();
            updateTestResult('Backend Health Check', healthOk ? 'success' : 'error', healthOk ? 'Backend is responding' : 'Backend not reachable');
            // Test 2: HTTP Trace API
            if (healthOk) {
                const apiOk = await (0, httpTest_1.testHttpTraceAPI)();
                updateTestResult('HTTP Trace API', apiOk ? 'success' : 'error', apiOk ? 'API accepts traces' : 'API endpoint failed');
            }
            else {
                updateTestResult('HTTP Trace API', 'error', 'Skipped - backend not available');
            }
            // Test 3: WebSocket Connection
            updateTestResult('WebSocket Connection', status.connected ? 'success' : 'error', status.connected ? 'WebSocket is connected' : 'WebSocket not connected');
            // Test 4: Live Trace Streaming
            if (status.connected) {
                try {
                    // Ensure we have a session
                    if (!currentSession) {
                        addSession('Test Session');
                    }
                    // Send a test trace via WebSocket
                    const testTrace = {
                        id: `test-trace-${Date.now()}`,
                        sessionId: currentSession.id,
                        chainId: 'connection-test-chain',
                        timestamp: Date.now(),
                        type: 'prompt',
                        status: 'completed',
                        data: {
                            prompt: 'Connection test trace - ' + new Date().toLocaleTimeString(),
                            model: 'test-model',
                            test: true,
                            source: 'connection-tester'
                        }
                    };
                    sendTrace(testTrace);
                    updateTestResult('Live Trace Streaming', 'success', 'Test trace sent successfully');
                }
                catch (error) {
                    updateTestResult('Live Trace Streaming', 'error', 'Failed to send test trace');
                }
            }
            else {
                updateTestResult('Live Trace Streaming', 'error', 'Skipped - WebSocket not connected');
            }
        }
        catch (error) {
            console.error('Test suite failed:', error);
        }
        finally {
            setIsRunning(false);
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <lucide_react_1.Loader2 className="w-4 h-4 animate-spin text-yellow-500"/>;
            case 'success':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'error':
                return <lucide_react_1.XCircle className="w-4 h-4 text-red-500"/>;
        }
    };
    return (<div className="p-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <lucide_react_1.TestTube2 className="w-4 h-4"/>
          Connection Tests
        </h3>
        <button onClick={runTests} disabled={isRunning} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {testResults.length > 0 && (<div className="space-y-2">
          {testResults.map((test) => (<div key={test.name} className="flex items-start gap-2 text-xs">
              {getStatusIcon(test.status)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{test.name}</div>
                {test.message && (<div className={`truncate ${test.status === 'success' ? 'text-green-600' :
                        test.status === 'error' ? 'text-red-600' :
                            'text-gray-500'}`}>
                    {test.message}
                  </div>)}
              </div>
            </div>))}
        </div>)}

      {testResults.length === 0 && (<p className="text-xs text-gray-500">
          Click "Run Tests" to verify all connections are working properly.
        </p>)}
    </div>);
};
exports.ConnectionTester = ConnectionTester;
