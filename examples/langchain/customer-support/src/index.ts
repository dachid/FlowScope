/**
 * E-commerce Customer Support Bot - Simplified Real-World Example
 * 
 * This demonstrates FlowScope integration with a basic but realistic
 * customer support bot that can be run immediately for testing.
 */

import { FlowScopeSDK } from '@flowscope/sdk';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize FlowScope SDK with automatic LangChain detection
const flowscope = new FlowScopeSDK({
  projectId: 'customer-support-bot',
  debug: true,
  autoDetect: true
});

// Customer response interface
interface CustomerResponse {
  intent: 'order_status' | 'product_info' | 'returns' | 'account' | 'general';
  confidence: number;
  response: string;
  requiresHuman: boolean;
  suggestedActions?: string[];
}

class CustomerSupportBot {
  private sessionMemory: Map<string, any[]> = new Map();

  constructor() {
    console.log('🤖 Customer Support Bot initialized');
  }

  async handleCustomerQuery(
    query: string, 
    customerId: string,
    sessionId?: string
  ): Promise<CustomerResponse> {
    try {
      // Start FlowScope session for this customer interaction
      const session = sessionId || `session_${customerId}_${Date.now()}`;
      
      flowscope.startSession(session, {
        customerId,
        query: query.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      // Manual trace for query processing start
      flowscope.trace(session, {
        id: `query_start_${Date.now()}`,
        type: 'prompt',
        data: {
          input: query,
          customerId,
          intent_detection: 'analyzing customer query'
        },
        metadata: {
          step: 'query_analysis',
          customer_type: 'premium'
        }
      });

      // Simulate customer data lookup
      const customerData = await this.getCustomerData(customerId);
      
      // Manual trace for data retrieval
      flowscope.trace(session, {
        id: `data_retrieval_${Date.now()}`,
        type: 'function_call',
        data: {
          function: 'getCustomerData',
          input: customerId,
          output: customerData
        }
      });

      // Simulate intent classification
      const intent = this.classifyIntent(query);
      
      // Manual trace for intent classification
      flowscope.trace(session, {
        id: `intent_classification_${Date.now()}`,
        type: 'response',
        data: {
          intent,
          confidence: 0.95,
          classification_method: 'keyword_matching'
        }
      });

      // Generate response based on intent
      const response = await this.generateResponse(intent, query, customerData);
      
      // Manual trace for response generation
      flowscope.trace(session, {
        id: `response_generation_${Date.now()}`,
        type: 'response',
        data: {
          intent,
          response: response.response,
          requires_human: response.requiresHuman
        }
      });

      // Store conversation in session memory
      this.updateSessionMemory(session, {
        query,
        response: response.response,
        timestamp: new Date().toISOString()
      });

      return response;

    } catch (error) {
      console.error('Error processing customer query:', error);
      
      // Trace the error
      flowscope.trace(sessionId || 'error_session', {
        id: `error_${Date.now()}`,
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query,
          customerId
        }
      });

      return {
        intent: 'general',
        confidence: 0.1,
        response: 'I apologize, but I\'m experiencing technical difficulties. Let me connect you with a human agent.',
        requiresHuman: true,
        suggestedActions: ['escalate_to_human']
      };
    } finally {
      // End the FlowScope session
      flowscope.endSession();
    }
  }

  private classifyIntent(query: string): CustomerResponse['intent'] {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('order') || queryLower.includes('tracking') || queryLower.includes('status')) {
      return 'order_status';
    }
    if (queryLower.includes('return') || queryLower.includes('refund') || queryLower.includes('exchange')) {
      return 'returns';
    }
    if (queryLower.includes('product') || queryLower.includes('specification') || queryLower.includes('feature')) {
      return 'product_info';
    }
    if (queryLower.includes('account') || queryLower.includes('profile') || queryLower.includes('login')) {
      return 'account';
    }
    
    return 'general';
  }

  private async generateResponse(
    intent: CustomerResponse['intent'],
    query: string,
    customerData: any
  ): Promise<CustomerResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (intent) {
      case 'order_status':
        if (customerData.orders.length > 0) {
          const latestOrder = customerData.orders[customerData.orders.length - 1];
          return {
            intent,
            confidence: 0.95,
            response: `Your latest order ${latestOrder.id} is currently ${latestOrder.status}. It contains ${latestOrder.items.join(', ')} for a total of $${latestOrder.total}.`,
            requiresHuman: false,
            suggestedActions: ['track_package', 'view_order_details']
          };
        } else {
          return {
            intent,
            confidence: 0.8,
            response: 'I don\'t see any recent orders for your account. Would you like to browse our products or check if you\'re signed into the correct account?',
            requiresHuman: false,
            suggestedActions: ['browse_products', 'check_account']
          };
        }

      case 'returns':
        return {
          intent,
          confidence: 0.9,
          response: 'I can help you with returns! You can return most items within 30 days of purchase. Would you like me to start a return for a specific order?',
          requiresHuman: false,
          suggestedActions: ['start_return', 'return_policy']
        };

      case 'product_info':
        return {
          intent,
          confidence: 0.85,
          response: 'I\'d be happy to help you learn more about our products! Could you tell me which specific product you\'re interested in?',
          requiresHuman: false,
          suggestedActions: ['browse_catalog', 'compare_products']
        };

      case 'account':
        return {
          intent,
          confidence: 0.9,
          response: `Hi! I can see you're a ${customerData.status} customer. How can I help you with your account today?`,
          requiresHuman: false,
          suggestedActions: ['update_profile', 'change_password', 'view_orders']
        };

      default:
        return {
          intent,
          confidence: 0.6,
          response: 'Thank you for contacting TechMart support! I\'m here to help with orders, returns, product information, and account questions. What can I assist you with today?',
          requiresHuman: false,
          suggestedActions: ['order_help', 'product_help', 'account_help']
        };
    }
  }

  private async getCustomerData(customerId: string) {
    // Simulate database lookup with realistic customer data
    const mockCustomerDB: Record<string, any> = {
      'cust_001': {
        status: 'premium',
        orders: [
          { id: 'ORD-001', status: 'delivered', total: 299.99, items: ['MacBook Air'] },
          { id: 'ORD-002', status: 'processing', total: 89.99, items: ['Wireless Mouse'] }
        ]
      },
      'cust_002': {
        status: 'standard',
        orders: [
          { id: 'ORD-003', status: 'shipped', total: 599.99, items: ['Gaming Monitor'] }
        ]
      },
      'cust_003': {
        status: 'new',
        orders: []
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return mockCustomerDB[customerId] || {
      status: 'standard',
      orders: []
    };
  }

  private updateSessionMemory(sessionId: string, interaction: any) {
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, []);
    }
    this.sessionMemory.get(sessionId)!.push(interaction);
  }

  getSessionHistory(sessionId: string) {
    return this.sessionMemory.get(sessionId) || [];
  }
}

// Express server for testing the customer support bot
class CustomerSupportServer {
  private app: express.Application;
  private bot: CustomerSupportBot;

  constructor() {
    this.app = express();
    this.bot = new CustomerSupportBot();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Main customer support endpoint
    this.app.post('/api/support', async (req, res) => {
      try {
        const { query, customerId, sessionId } = req.body;

        if (!query || !customerId) {
          return res.status(400).json({
            error: 'Missing required fields: query and customerId'
          });
        }

        const response = await this.bot.handleCustomerQuery(
          query, 
          customerId, 
          sessionId
        );

        res.json({
          success: true,
          data: response,
          metadata: {
            timestamp: new Date().toISOString(),
            customerId,
            sessionId: sessionId || `auto_${Date.now()}`
          }
        });

      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get session history
    this.app.get('/api/support/history/:sessionId', (req, res) => {
      try {
        const { sessionId } = req.params;
        const history = this.bot.getSessionHistory(sessionId);
        res.json({ success: true, data: history });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get session history' });
      }
    });

    // FlowScope integration status
    this.app.get('/api/debug/flowscope', (req, res) => {
      res.json({
        status: 'active',
        sdkInitialized: true,
        traceCount: flowscope.getTraces().length,
        features: [
          'Manual tracing',
          'Session management',
          'Intent classification debugging',
          'Customer data retrieval tracing'
        ]
      });
    });

    // Test endpoint for generating sample traces
    this.app.post('/api/debug/generate-traces', async (req, res) => {
      try {
        const testQueries = [
          { query: "What's the status of order ORD-001?", customerId: "cust_001" },
          { query: "I want to return my wireless mouse", customerId: "cust_001" },
          { query: "Tell me about the MacBook Air", customerId: "cust_002" },
          { query: "Help me with my account", customerId: "cust_003" }
        ];

        const results: Array<{query: string, result: CustomerResponse}> = [];
        for (const test of testQueries) {
          const result = await this.bot.handleCustomerQuery(
            test.query, 
            test.customerId, 
            `demo_${Date.now()}_${Math.random()}`
          );
          results.push({ query: test.query, result });
        }

        res.json({ 
          success: true, 
          message: 'Generated sample traces', 
          data: results 
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate traces' });
      }
    });
  }

  start(port: number = 3003) {
    return new Promise<void>((resolve) => {
      this.app.listen(port, () => {
        console.log(`🤖 Customer Support Bot running on http://localhost:${port}`);
        console.log(`📊 FlowScope debugging enabled`);
        console.log(`\n🧪 Test the bot:`);
        console.log(`  curl -X POST http://localhost:${port}/api/support \\`);
        console.log(`    -H "Content-Type: application/json" \\`);
        console.log(`    -d '{"query":"What is my order status?","customerId":"cust_001"}'`);
        console.log(`\n📈 Generate sample traces:`);
        console.log(`  curl -X POST http://localhost:${port}/api/debug/generate-traces`);
        resolve();
      });
    });
  }
}

// Initialize and start the application
async function main() {
  try {
    // Initialize FlowScope
    await flowscope.init();
    console.log('✅ FlowScope SDK initialized');

    // Start the server
    const server = new CustomerSupportServer();
    await server.start(3003);

  } catch (error) {
    console.error('❌ Failed to start customer support bot:', error);
    process.exit(1);
  }
}

// Export for testing
export { CustomerSupportBot, CustomerSupportServer };

// Run if this is the main module
if (require.main === module) {
  main();
}
