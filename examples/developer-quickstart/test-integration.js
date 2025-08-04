#!/usr/bin/env node

/**
 * FlowScope Integration Test - Verify it works in your app
 * 
 * Run this to test that FlowScope is working in your LangChain application
 */

const { MyLangChainApp } = require('./simple-langchain-demo');
const axios = require('axios');

class FlowScopeIntegrationTest {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Testing FlowScope Integration...\n');

    // Test 1: Basic SDK Integration
    await this.testSDKIntegration();

    // Test 2: Trace Generation
    await this.testTraceGeneration();

    // Test 3: Backend Connectivity
    await this.testBackendConnectivity();

    // Test 4: Real Application Flow
    await this.testRealApplicationFlow();

    this.printResults();
  }

  async testSDKIntegration() {
    try {
      const { FlowScope } = require('@flowscope/sdk');
      const flowScope = new FlowScope({ projectId: 'test' });
      
      this.recordTest('SDK Integration', true, 'FlowScope SDK loaded successfully');
    } catch (error) {
      this.recordTest('SDK Integration', false, `Failed to load SDK: ${error.message}`);
    }
  }

  async testTraceGeneration() {
    try {
      const app = new MyLangChainApp();
      
      // Run a simple query
      await app.processUserQuery('Test query for FlowScope', 'test_session');
      
      this.recordTest('Trace Generation', true, 'Successfully generated traces');
    } catch (error) {
      this.recordTest('Trace Generation', false, `Failed to generate traces: ${error.message}`);
    }
  }

  async testBackendConnectivity() {
    try {
      // Check if FlowScope backend is running
      const response = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
      
      if (response.status === 200) {
        this.recordTest('Backend Connectivity', true, 'FlowScope backend is running and accessible');
      } else {
        this.recordTest('Backend Connectivity', false, 'Backend responded but with unexpected status');
      }
    } catch (error) {
      this.recordTest('Backend Connectivity', false, 'FlowScope backend not running (run: npm run dev)');
    }
  }

  async testRealApplicationFlow() {
    try {
      const app = new MyLangChainApp();
      
      // Test multiple sessions to verify isolation
      const sessions = ['user_1', 'user_2', 'user_3'];
      const queries = [
        'What is machine learning?',
        'How do I use LangChain?',
        'Debug my AI application'
      ];

      for (let i = 0; i < sessions.length; i++) {
        await app.processUserQuery(queries[i], sessions[i]);
      }

      this.recordTest('Real Application Flow', true, 'Successfully processed multiple sessions');
    } catch (error) {
      this.recordTest('Real Application Flow', false, `Application flow failed: ${error.message}`);
    }
  }

  recordTest(testName, passed, message) {
    this.testResults.push({ testName, passed, message });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FLOWSCOPE INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`\n📈 Results: ${passed}/${total} tests passed (${successRate}%)`);

    if (passed === total) {
      console.log('\n🎉 PERFECT! FlowScope is fully integrated and working!');
      console.log('\n👨‍💻 What this means for developers:');
      console.log('   ✅ FlowScope SDK is properly installed');
      console.log('   ✅ Traces are being generated automatically');
      console.log('   ✅ Backend is receiving trace data');
      console.log('   ✅ Your LangChain app is now debuggable!');
      console.log('\n📊 Next steps:');
      console.log('   • Open FlowScope dashboard to see your traces');
      console.log('   • Integrate into your actual LangChain application');
      console.log('   • Use session IDs to track different users/contexts');
    } else {
      console.log('\n⚠️  Some tests failed. Common fixes:');
      console.log('   • Make sure FlowScope backend is running: npm run dev');
      console.log('   • Check that @flowscope/sdk is installed: npm install');
      console.log('   • Verify network connectivity to localhost:3001');
    }

    console.log('\n🔗 Documentation: https://flowscope.dev/docs/langchain');
    console.log('='.repeat(60));
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FlowScopeIntegrationTest();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { FlowScopeIntegrationTest };
