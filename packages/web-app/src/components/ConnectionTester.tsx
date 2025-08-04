import React, { useState } from 'react';
import { TestTube2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { testHttpTraceAPI, checkBackendHealth } from '../utils/httpTest';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDebuggerStore } from '../store/debugger';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export const ConnectionTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { status, sendTrace } = useWebSocket();
  const { currentSession, addSession } = useDebuggerStore();

  const updateTestResult = (name: string, status: TestResult['status'], message?: string) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name ? { ...test, status, message } : test
      )
    );
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
      const healthOk = await checkBackendHealth();
      updateTestResult(
        'Backend Health Check', 
        healthOk ? 'success' : 'error',
        healthOk ? 'Backend is responding' : 'Backend not reachable'
      );

      // Test 2: HTTP Trace API
      if (healthOk) {
        const apiOk = await testHttpTraceAPI();
        updateTestResult(
          'HTTP Trace API',
          apiOk ? 'success' : 'error',
          apiOk ? 'API accepts traces' : 'API endpoint failed'
        );
      } else {
        updateTestResult('HTTP Trace API', 'error', 'Skipped - backend not available');
      }

      // Test 3: WebSocket Connection
      updateTestResult(
        'WebSocket Connection',
        status.connected ? 'success' : 'error',
        status.connected ? 'WebSocket is connected' : 'WebSocket not connected'
      );

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
            sessionId: currentSession!.id,
            chainId: 'connection-test-chain',
            timestamp: Date.now(),
            type: 'prompt' as const,
            status: 'completed' as const,
            data: {
              prompt: 'Connection test trace - ' + new Date().toLocaleTimeString(),
              model: 'test-model',
              test: true,
              source: 'connection-tester'
            }
          };

          sendTrace(testTrace);
          
          updateTestResult(
            'Live Trace Streaming',
            'success',
            'Test trace sent successfully'
          );
        } catch (error) {
          updateTestResult(
            'Live Trace Streaming',
            'error',
            'Failed to send test trace'
          );
        }
      } else {
        updateTestResult(
          'Live Trace Streaming',
          'error',
          'Skipped - WebSocket not connected'
        );
      }

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <TestTube2 className="w-4 h-4" />
          Connection Tests
        </h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((test) => (
            <div key={test.name} className="flex items-start gap-2 text-xs">
              {getStatusIcon(test.status)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{test.name}</div>
                {test.message && (
                  <div className={`truncate ${
                    test.status === 'success' ? 'text-green-600' : 
                    test.status === 'error' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {test.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && (
        <p className="text-xs text-gray-500">
          Click "Run Tests" to verify all connections are working properly.
        </p>
      )}
    </div>
  );
};
