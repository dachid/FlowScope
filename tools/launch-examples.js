#!/usr/bin/env node

/**
 * FlowScope Example Applications Launcher
 * 
 * This script helps you start all the real-world example applications
 * for testing FlowScope's Tier 1 features.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ExampleLauncher {
  constructor() {
    this.processes = [];
    this.examples = [
      {
        name: 'Customer Support Bot',
        path: 'examples/langchain/customer-support',
        port: 3003,
        description: 'E-commerce customer support with LangChain integration'
      },
      {
        name: 'Document Search RAG',
        path: 'examples/llamaindex/document-search',
        port: 3004,
        description: 'Enterprise document search with LlamaIndex integration'
      },
      {
        name: 'Hybrid RAG System',
        path: 'examples/hybrid/rag-system',
        port: 3005,
        description: 'Multi-framework system combining LangChain + LlamaIndex'
      }
    ];
  }

  async launchAll() {
    console.log('🚀 FlowScope Example Applications Launcher\n');
    
    // Check if FlowScope backend is running
    await this.checkBackend();
    
    console.log('📦 Installing dependencies for all examples...\n');
    await this.installDependencies();
    
    console.log('🎯 Starting all example applications...\n');
    
    for (const example of this.examples) {
      await this.launchExample(example);
      await this.sleep(2000); // Wait between launches
    }
    
    this.printStatus();
    this.setupGracefulShutdown();
    
    console.log('\n✨ All examples are running! Press Ctrl+C to stop all services.\n');
    
    // Keep the process alive
    process.stdin.resume();
  }

  async checkBackend() {
    console.log('🔍 Checking FlowScope backend...');
    
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/api/health');
      if (response.status === 200) {
        console.log('✅ FlowScope backend is running');
        console.log(`   Service: ${response.data.service}`);
        console.log(`   Version: ${response.data.version}\n`);
      }
    } catch (error) {
      console.log('⚠️  FlowScope backend not detected on port 3001');
      console.log('   Please start it with: npm run dev\n');
    }
  }

  async installDependencies() {
    for (const example of this.examples) {
      const examplePath = path.resolve(example.path);
      
      if (!fs.existsSync(path.join(examplePath, 'package.json'))) {
        console.log(`❌ No package.json found for ${example.name}`);
        continue;
      }
      
      console.log(`📦 Installing dependencies for ${example.name}...`);
      
      try {
        await this.runCommand('npm', ['install'], examplePath);
        console.log(`✅ Dependencies installed for ${example.name}`);
      } catch (error) {
        console.log(`❌ Failed to install dependencies for ${example.name}:`, error.message);
      }
    }
    console.log('');
  }

  async launchExample(example) {
    const examplePath = path.resolve(example.path);
    
    if (!fs.existsSync(examplePath)) {
      console.log(`❌ Example directory not found: ${example.path}`);
      return;
    }
    
    console.log(`🚀 Starting ${example.name} on port ${example.port}...`);
    console.log(`   ${example.description}`);
    
    try {
      const process = spawn('npm', ['start'], {
        cwd: examplePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      this.processes.push({
        name: example.name,
        port: example.port,
        process: process,
        path: example.path
      });
      
      // Handle output
      process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${example.name}] ${output}`);
        }
      });
      
      process.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('ExperimentalWarning')) {
          console.log(`[${example.name}] ERROR: ${output}`);
        }
      });
      
      process.on('close', (code) => {
        console.log(`[${example.name}] Process exited with code ${code}`);
      });
      
      // Wait a bit for the process to start
      await this.sleep(1000);
      
      console.log(`✅ ${example.name} started successfully\n`);
      
    } catch (error) {
      console.log(`❌ Failed to start ${example.name}:`, error.message);
    }
  }

  printStatus() {
    console.log('📊 Running Applications:');
    console.log('='.repeat(80));
    console.log('FlowScope Backend:        http://localhost:3001');
    
    for (const proc of this.processes) {
      console.log(`${proc.name.padEnd(24)}: http://localhost:${proc.port}`);
    }
    
    console.log('='.repeat(80));
    console.log('\n🧪 Test URLs:');
    console.log('Customer Support API:    http://localhost:3003/api/support');
    console.log('Document Search API:     http://localhost:3004/api/search');
    console.log('Hybrid System API:       http://localhost:3005/api/chat');
    console.log('\n🔍 Debug Endpoints:');
    console.log('Customer Support Debug:  http://localhost:3003/api/debug/flowscope');
    console.log('Document Search Debug:   http://localhost:3004/api/debug/flowscope');
    console.log('Hybrid System Debug:     http://localhost:3005/api/debug/flowscope');
    console.log('\n📈 Validation:');
    console.log('Run validation suite:    node tools/tier1-validation.js');
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      console.log('\n\n🛑 Shutting down all example applications...');
      
      for (const proc of this.processes) {
        console.log(`   Stopping ${proc.name}...`);
        proc.process.kill('SIGTERM');
      }
      
      setTimeout(() => {
        console.log('✅ All applications stopped. Goodbye!');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Commands
function printUsage() {
  console.log('FlowScope Example Applications Launcher');
  console.log('');
  console.log('This script helps you start all real-world example applications');
  console.log('for testing FlowScope\'s Tier 1 features.');
  console.log('');
  console.log('Commands:');
  console.log('  node tools/launch-examples.js          Start all examples');
  console.log('  node tools/launch-examples.js --help   Show this help');
  console.log('');
  console.log('What this script does:');
  console.log('1. Checks if FlowScope backend is running');
  console.log('2. Installs dependencies for all examples');
  console.log('3. Starts all example applications on different ports');
  console.log('4. Provides test URLs and validation instructions');
  console.log('');
  console.log('Examples included:');
  console.log('- Customer Support Bot (LangChain) - Port 3003');
  console.log('- Document Search RAG (LlamaIndex) - Port 3004');
  console.log('- Hybrid RAG System (Both) - Port 3005');
  console.log('');
  console.log('After starting, you can:');
  console.log('- Test the APIs using the provided URLs');
  console.log('- Run validation: node tools/tier1-validation.js');
  console.log('- View FlowScope dashboard: http://localhost:3001');
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const launcher = new ExampleLauncher();
  launcher.launchAll().catch(error => {
    console.error('Launcher error:', error);
    process.exit(1);
  });
}

module.exports = { ExampleLauncher };
