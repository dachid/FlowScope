/**
 * Enhanced Manual SDK Example - Context Manager Usage
 * 
 * This example shows how to use FlowScope context managers for
 * automatic span management with nested operations and proper cleanup.
 */

// Mock enhanced manual SDK - same as decorator example
class MockEnhancedSDK {
  constructor() {
    this.traces = [];
    this.config = {};
    this.contextStack = [];
  }
  
  configure(config) {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Enhanced SDK configured:', this.config);
  }
  
  // Context manager for nested operations
  async withContext(contextName, metadata, fn) {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    
    console.log(`🔄 Context started: ${contextName}`);
    
    // Create span object for the context function
    const span = {
      contextId,
      contextName,
      metadata: { ...metadata },
      tags: {},
      
      setTag(key, value) {
        this.tags[key] = value;
        console.log(`🏷️ Context tag set: ${key} = ${value}`);
      },
      
      setResult(result) {
        this.result = result;
        console.log(`📊 Context result set:`, result);
      }
    };
    
    // Add to context stack
    this.contextStack.push(span);
    
    try {
      const result = await fn(span);
      
      const duration = Date.now() - startTime;
      
      // Capture context trace
      this.traces.push({
        traceId: contextId,
        operationType: 'context_execution',
        contextName,
        timestamp: startTime,
        duration,
        success: true,
        metadata,
        tags: span.tags,
        result: span.result || result,
        depth: this.contextStack.length
      });
      
      console.log(`✅ Context completed: ${contextName} (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.traces.push({
        traceId: contextId,
        operationType: 'context_execution',
        contextName,
        timestamp: startTime,
        duration,
        success: false,
        error: error.message,
        metadata,
        depth: this.contextStack.length
      });
      
      console.log(`❌ Context failed: ${contextName} (${duration}ms)`);
      throw error;
      
    } finally {
      // Remove from context stack
      this.contextStack.pop();
    }
  }
  
  getTraces() {
    return [...this.traces];
  }
  
  async flush() {
    console.log(`🚀 Flushing ${this.traces.length} enhanced traces...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Enhanced traces flushed successfully');
  }
}

// Create enhanced SDK instance
const flowscope = new MockEnhancedSDK();

// Simulate different types of operations
class DatabaseService {
  async query(sql, params = []) {
    console.log(`🗄️ Executing query: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    if (sql.includes('SELECT')) {
      return { rows: Math.floor(Math.random() * 10) + 1, data: 'mock_data' };
    }
    
    return { affected: 1 };
  }
  
  async transaction(operations) {
    console.log('📊 Starting database transaction');
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const results = [];
    for (const op of operations) {
      results.push(await op());
    }
    
    console.log('✅ Transaction committed');
    return results;
  }
}

class CacheService {
  constructor() {
    this.cache = new Map();
  }
  
  async get(key) {
    console.log(`🔍 Cache lookup: ${key}`);
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10));
    return this.cache.get(key);
  }
  
  async set(key, value) {
    console.log(`💾 Cache store: ${key}`);
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10));
    this.cache.set(key, value);
  }
}

class UserService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }
  
  async getUser(userId) {
    // Using context manager for automatic span management
    return await flowscope.withContext('user_retrieval', { 
      userId,
      metadata: { service: 'user', operation: 'get' }
    }, async (span) => {
      console.log(`👤 Getting user: ${userId}`);
      
      // Check cache first
      const cacheKey = `user:${userId}`;
      const cached = await flowscope.withContext('cache_lookup', { key: cacheKey }, async () => {
        return await this.cache.get(cacheKey);
      });
      
      if (cached) {
        console.log('⚡ User found in cache');
        span.setTag('cache_hit', true);
        return cached;
      }
      
      // Query database
      const user = await flowscope.withContext('database_query', { 
        table: 'users',
        userId 
      }, async () => {
        const result = await this.db.query('SELECT * FROM users WHERE id = ?', [userId]);
        return result.data ? { id: userId, name: `User ${userId}`, email: `user${userId}@example.com` } : null;
      });
      
      if (user) {
        // Cache the result
        await flowscope.withContext('cache_store', { key: cacheKey }, async () => {
          await this.cache.set(cacheKey, user);
        });
        
        span.setTag('cache_hit', false);
        span.setTag('user_found', true);
        return user;
      }
      
      span.setTag('user_found', false);
      throw new Error(`User ${userId} not found`);
    });
  }
  
  async createUser(userData) {
    return await flowscope.withContext('user_creation', {
      userData: { name: userData.name, email: userData.email }, // Don't log sensitive data
      metadata: { service: 'user', operation: 'create' }
    }, async (span) => {
      console.log(`➕ Creating user: ${userData.name}`);
      
      // Validate user data
      const validation = await flowscope.withContext('user_validation', userData, async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        
        if (!userData.name || !userData.email) {
          throw new Error('Missing required fields');
        }
        
        if (!userData.email.includes('@')) {
          throw new Error('Invalid email format');
        }
        
        return { valid: true };
      });
      
      if (!validation.valid) {
        throw new Error('User validation failed');
      }
      
      // Create user in database within transaction
      const userId = Math.floor(Math.random() * 10000) + 1000;
      const user = await flowscope.withContext('database_transaction', { userId }, async () => {
        return await this.db.transaction([
          () => this.db.query('INSERT INTO users (id, name, email) VALUES (?, ?, ?)', [userId, userData.name, userData.email]),
          () => this.db.query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId])
        ]);
      });
      
      const newUser = { id: userId, ...userData };
      
      // Cache the new user
      await flowscope.withContext('cache_store', { key: `user:${userId}` }, async () => {
        await this.cache.set(`user:${userId}`, newUser);
      });
      
      span.setTag('user_id', userId);
      span.setResult({ userId });
      
      return newUser;
    });
  }
  
  async updateUser(userId, updates) {
    return await flowscope.withContext('user_update', {
      userId,
      updates,
      metadata: { service: 'user', operation: 'update' }
    }, async (span) => {
      console.log(`✏️ Updating user: ${userId}`);
      
      // Get current user
      const currentUser = await this.getUser(userId);
      
      // Apply updates
      const updatedUser = await flowscope.withContext('user_merge', { userId }, async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { ...currentUser, ...updates };
      });
      
      // Save to database
      await flowscope.withContext('database_update', { userId, updates }, async () => {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), userId];
        return await this.db.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
      });
      
      // Update cache
      await flowscope.withContext('cache_invalidate', { key: `user:${userId}` }, async () => {
        await this.cache.set(`user:${userId}`, updatedUser);
      });
      
      span.setTag('fields_updated', Object.keys(updates));
      span.setResult({ updated: true });
      
      return updatedUser;
    });
  }
}

// Example workflow demonstrating nested context managers
async function processUserWorkflow(userService) {
  return await flowscope.withContext('user_workflow', {
    workflow: 'complete_user_lifecycle',
    metadata: { component: 'workflow' }
  }, async (workflowSpan) => {
    console.log('\n🔄 Starting complete user workflow');
    
    // Step 1: Create a new user
    const newUser = await userService.createUser({
      name: 'John Doe',
      email: 'john.doe@example.com'
    });
    
    console.log(`✅ Created user: ${newUser.name} (ID: ${newUser.id})`);
    workflowSpan.setTag('created_user_id', newUser.id);
    
    // Step 2: Retrieve the user (should hit cache)
    const retrievedUser = await userService.getUser(newUser.id);
    console.log(`📖 Retrieved user: ${retrievedUser.name}`);
    
    // Step 3: Update the user
    const updatedUser = await userService.updateUser(newUser.id, {
      name: 'John Smith',
      lastLogin: new Date().toISOString()
    });
    
    console.log(`📝 Updated user: ${updatedUser.name}`);
    
    // Step 4: Retrieve again (cache should be updated)
    const finalUser = await userService.getUser(newUser.id);
    console.log(`🔍 Final retrieval: ${finalUser.name}`);
    
    workflowSpan.setTag('workflow_completed', true);
    workflowSpan.setResult({ 
      finalUser: { id: finalUser.id, name: finalUser.name } 
    });
    
    return finalUser;
  });
}

async function main() {
  console.log('🚀 Starting Enhanced Manual SDK - Context Manager Example');
  
  // Configure the enhanced SDK
  flowscope.configure({
    defaultSessionId: 'context-demo-session',
    autoFlush: true,
    maxContextDepth: 20,
    metadata: {
      application: 'context-demo',
      environment: 'development'
    }
  });
  
  const userService = new UserService();
  
  try {
    // Run the complete workflow
    const result = await processUserWorkflow(userService);
    console.log(`\n🎉 Workflow completed successfully for user: ${result.name}`);
    
    // Demonstrate error handling with context
    console.log('\n--- Testing Error Handling ---');
    try {
      await flowscope.withContext('error_test', { test: 'user_not_found' }, async (span) => {
        await userService.getUser(99999); // Non-existent user
      });
    } catch (error) {
      console.log(`❌ Expected error caught: ${error.message}`);
    }
    
    // Show context manager statistics
    console.log('\n📊 Context Manager Statistics:');
    const traces = flowscope.getTraces();
    console.log(`Total spans created: ${traces.length}`);
    
    const spansByType = traces.reduce((acc, trace) => {
      acc[trace.contextName] = (acc[trace.contextName] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Spans by context:');
    Object.entries(spansByType).forEach(([context, count]) => {
      console.log(`  ${context}: ${count} spans`);
    });
    
    // Show nesting depth analysis
    const maxDepth = Math.max(...traces.map(trace => trace.depth || 0));
    console.log(`Maximum nesting depth: ${maxDepth}`);
    
    // Performance analysis
    const avgDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0) / traces.length;
    const successRate = (traces.filter(t => t.success).length / traces.length) * 100;
    
    console.log('\n📈 Performance Analysis:');
    console.log(`Average span duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
  
  // Flush traces
  console.log('\n🚀 Flushing traces to backend...');
  await flowscope.flush();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Export for testing
module.exports = {
  MockEnhancedSDK,
  DatabaseService,
  CacheService,
  UserService,
  processUserWorkflow,
  flowscope
};

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
