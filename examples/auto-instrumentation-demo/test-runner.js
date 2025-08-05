#!/usr/bin/env node

/**
 * Auto-Instrumentation Demo Test Runner
 * 
 * Simple testing script for the three integration approaches.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

class DemoTestRunner {
  constructor() {
    this.results = [];
    this.testStartTime = Date.now();
    console.log('🧪 FlowScope Auto-Instrumentation Demo Test Runner');
    console.log('=' .repeat(60));
  }
  
  async runDemo(demoName, scriptPath, timeout = 20000) {
    console.log(`\n🔍 Running ${demoName} demo...`);
    console.log(`📁 Script: ${scriptPath}`);
    
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const child = spawn('node', [scriptPath], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: path.dirname(scriptPath)
      });
      
      let stdout = '';
      let stderr = '';
      let completed = false;
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Show real-time output for important messages
        const output = data.toString();
        if (output.includes('✅') || output.includes('❌') || output.includes('🎉')) {
          process.stdout.write(output);
        }
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });
      
      child.on('close', (code) => {
        if (!completed) {
          completed = true;
          const duration = performance.now() - startTime;
          
          const result = {
            demoName,
            success: code === 0,
            duration: duration,
            exitCode: code,
            stdout: stdout,
            stderr: stderr
          };
          
          console.log(`${result.success ? '✅' : '❌'} ${demoName} ${result.success ? 'passed' : 'failed'} in ${duration.toFixed(2)}ms`);
          
          resolve(result);
        }
      });
      
      child.on('error', (error) => {
        if (!completed) {
          completed = true;
          const duration = performance.now() - startTime;
          
          console.log(`❌ ${demoName} error: ${error.message}`);
          
          resolve({
            demoName,
            success: false,
            duration: duration,
            error: error.message
          });
        }
      });
      
      // Timeout handling
      const timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          child.kill('SIGTERM');
          
          const duration = performance.now() - startTime;
          console.log(`⏰ ${demoName} timed out after ${timeout}ms`);
          
          resolve({
            demoName,
            success: false,
            duration: duration,
            timeout: true
          });
        }
      }, timeout);
      
      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }
  
  async runAllDemos() {
    const demoSuites = [
      {
        name: 'Auto-Instrumentation Basic',
        path: './examples/auto-instrumentation/basic.js'
      },
      {
        name: 'Import Replacement Basic',
        path: './examples/import-replacement/basic.js'
      },
      {
        name: 'Enhanced Manual Decorator',
        path: './examples/enhanced-manual/decorator.js'
      },
      {
        name: 'Enhanced Manual Context',
        path: './examples/enhanced-manual/context.js'
      }
    ];
    
    console.log(`🎯 Running ${demoSuites.length} demo suites`);
    
    const results = [];
    
    for (let i = 0; i < demoSuites.length; i++) {
      const suite = demoSuites[i];
      console.log(`\n--- Demo ${i + 1}/${demoSuites.length} ---`);
      
      const scriptPath = path.resolve(__dirname, suite.path);
      
      // Check if script exists
      if (!fs.existsSync(scriptPath)) {
        console.log(`❌ Script not found: ${scriptPath}`);
        results.push({
          demoName: suite.name,
          success: false,
          error: 'Script not found',
          duration: 0
        });
        continue;
      }
      
      try {
        const result = await this.runDemo(suite.name, scriptPath);
        results.push(result);
        
        // Small delay between demos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Demo failed with exception: ${error.message}`);
        results.push({
          demoName: suite.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    return results;
  }
  
  generateReport(results) {
    const totalDuration = Date.now() - this.testStartTime;
    
    console.log('\n📊 Demo Results Summary');
    console.log('=' .repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Total demos: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);
    
    // Detailed results
    console.log('\n📋 Detailed Results');
    console.log('-' .repeat(60));
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A';
      
      console.log(`${index + 1}. ${status} ${result.demoName} (${duration})`);
      
      if (!result.success) {
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.timeout) {
          console.log(`   Reason: Timeout`);
        }
        if (result.exitCode && result.exitCode !== 0) {
          console.log(`   Exit code: ${result.exitCode}`);
        }
      }
    });
    
    // Performance analysis
    const successfulDemos = results.filter(r => r.success && r.duration);
    if (successfulDemos.length > 0) {
      console.log('\n⚡ Performance Analysis');
      console.log('-' .repeat(60));
      
      const avgDuration = successfulDemos.reduce((sum, r) => sum + r.duration, 0) / successfulDemos.length;
      const maxDuration = Math.max(...successfulDemos.map(r => r.duration));
      const minDuration = Math.min(...successfulDemos.map(r => r.duration));
      
      console.log(`Average demo duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`Fastest demo: ${minDuration.toFixed(2)}ms`);
      console.log(`Slowest demo: ${maxDuration.toFixed(2)}ms`);
    }
    
    return {
      total: results.length,
      passed,
      failed,
      successRate: (passed / results.length) * 100,
      totalDuration,
      results
    };
  }
}

async function main() {
  const runner = new DemoTestRunner();
  
  try {
    const results = await runner.runAllDemos();
    const summary = runner.generateReport(results);
    
    console.log('\n🎉 Demo testing completed!');
    
    // Exit with appropriate code
    process.exit(summary.passed === summary.total ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Demo runner failed:', error);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Demo runner interrupted by user');
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection in demo runner:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DemoTestRunner };
