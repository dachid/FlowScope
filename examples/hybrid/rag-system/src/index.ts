/**
 * Hybrid RAG System - LangChain + LlamaIndex Integration
 * 
 * This demonstrates the ultimate FlowScope value proposition:
 * Complex multi-framework AI applications with full observability.
 * 
 * Architecture:
 * 1. LlamaIndex for document retrieval and indexing
 * 2. LangChain for conversation management and reasoning chains
 * 3. Hybrid pipeline combining both frameworks
 * 4. FlowScope providing end-to-end visibility
 * 
 * Real-World Use Case:
 * An intelligent business assistant that can:
 * - Search company documents (LlamaIndex)
 * - Maintain conversation context (LangChain)
 * - Perform multi-step reasoning (LangChain)
 * - Generate comprehensive responses (Hybrid)
 */

import { FlowScopeSDK } from '@flowscope/sdk';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize FlowScope SDK - will detect both LangChain and LlamaIndex
const flowscope = new FlowScopeSDK({
  projectId: 'hybrid-rag-system',
  debug: true,
  autoDetect: true
});

// Enhanced interfaces for hybrid system
interface HybridDocument {
  id: string;
  title: string;
  content: string;
  embeddings?: number[]; // Simulated embeddings
  metadata: {
    source: string;
    category: 'technical' | 'business' | 'hr' | 'legal';
    importance: number;
    lastUpdated: string;
  };
}

interface ConversationContext {
  messages: Array<{role: 'user' | 'assistant', content: string, timestamp: string}>;
  userIntent: string;
  documentReferences: string[];
  reasoningChain: string[];
}

interface HybridResponse {
  answer: string;
  confidence: number;
  reasoning: string[];
  sources: Array<{
    document: HybridDocument;
    relevance: number;
    extractedContent: string;
  }>;
  conversationContext: ConversationContext;
  nextSteps?: string[];
}

class HybridRAGSystem {
  private documents: Map<string, HybridDocument> = new Map();
  private conversationSessions: Map<string, ConversationContext> = new Map();

  constructor() {
    console.log('🔀 Hybrid RAG System (LangChain + LlamaIndex) initialized');
    this.loadHybridDocuments();
  }

  async processQuery(
    query: string,
    sessionId: string,
    userId?: string
  ): Promise<HybridResponse> {
    try {
      // Start comprehensive FlowScope session
      flowscope.startSession(sessionId, {
        query: query.substring(0, 100),
        userId,
        framework: 'hybrid_langchain_llamaindex',
        timestamp: new Date().toISOString()
      });

      // Phase 1: Query Analysis (LangChain-style reasoning)
      const queryAnalysis = await this.analyzeQuery(query, sessionId);
      
      // Phase 2: Document Retrieval (LlamaIndex-style RAG)
      const documentResults = await this.retrieveDocuments(queryAnalysis, sessionId);
      
      // Phase 3: Context Preparation (Hybrid approach)
      const context = await this.prepareHybridContext(query, documentResults, sessionId);
      
      // Phase 4: Response Generation (LangChain conversation chain)
      const response = await this.generateHybridResponse(query, context, sessionId);
      
      // Phase 5: Context Management (LangChain memory)
      await this.updateConversationContext(sessionId, query, response);

      return response;

    } catch (error) {
      console.error('Error in hybrid RAG processing:', error);
      
      flowscope.trace(sessionId, {
        id: `hybrid_error_${Date.now()}`,
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query,
          phase: 'hybrid_processing'
        }
      });

      return {
        answer: 'I apologize, but I encountered an error while processing your request. The system is designed to handle complex queries using both document search and conversation context.',
        confidence: 0.1,
        reasoning: ['Error in hybrid processing pipeline'],
        sources: [],
        conversationContext: this.getOrCreateContext(sessionId)
      };
    } finally {
      flowscope.endSession();
    }
  }

  private async analyzeQuery(query: string, sessionId: string) {
    // Simulate LangChain-style query analysis
    flowscope.trace(sessionId, {
      id: `langchain_query_analysis_${Date.now()}`,
      type: 'prompt',
      data: {
        framework: 'langchain',
        operation: 'query_analysis',
        input: query,
        chain_type: 'reasoning_chain'
      },
      metadata: {
        step: 'query_analysis',
        framework: 'langchain'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    const analysis = {
      intent: this.classifyIntent(query),
      entities: this.extractEntities(query),
      complexity: this.assessComplexity(query),
      requiresDocuments: this.needsDocumentRetrieval(query),
      conversational: this.isConversational(query)
    };

    flowscope.trace(sessionId, {
      id: `langchain_analysis_result_${Date.now()}`,
      type: 'response',
      data: {
        framework: 'langchain',
        analysis,
        confidence: 0.9
      }
    });

    return analysis;
  }

  private async retrieveDocuments(analysis: any, sessionId: string) {
    // Simulate LlamaIndex-style document retrieval
    flowscope.trace(sessionId, {
      id: `llamaindex_retrieval_start_${Date.now()}`,
      type: 'function_call',
      data: {
        framework: 'llamaindex',
        operation: 'document_retrieval',
        query_analysis: analysis,
        index_size: this.documents.size
      },
      metadata: {
        step: 'document_retrieval',
        framework: 'llamaindex'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    const results: Array<{
      document: HybridDocument;
      relevance: number;
      extractedContent: string;
    }> = [];
    for (const [id, doc] of this.documents) {
      const relevance = this.calculateHybridRelevance(doc, analysis);
      if (relevance > 0.2) {
        results.push({
          document: doc,
          relevance,
          extractedContent: this.extractRelevantContent(doc, analysis)
        });
      }
    }

    const sortedResults = results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

    flowscope.trace(sessionId, {
      id: `llamaindex_retrieval_result_${Date.now()}`,
      type: 'response',
      data: {
        framework: 'llamaindex',
        retrieved_count: sortedResults.length,
        top_relevance_scores: sortedResults.map(r => r.relevance),
        document_categories: sortedResults.map(r => r.document.metadata.category)
      }
    });

    return sortedResults;
  }

  private async prepareHybridContext(query: string, documents: any[], sessionId: string) {
    // Hybrid context preparation combining both frameworks
    flowscope.trace(sessionId, {
      id: `hybrid_context_preparation_${Date.now()}`,
      type: 'function_call',
      data: {
        framework: 'hybrid',
        operation: 'context_preparation',
        document_count: documents.length,
        context_strategy: 'langchain_memory_plus_llamaindex_retrieval'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    const conversationHistory = this.getOrCreateContext(sessionId);
    
    const context = {
      query,
      retrievedDocuments: documents,
      conversationHistory: conversationHistory.messages.slice(-5), // Last 5 messages
      userIntent: conversationHistory.userIntent,
      previousReferences: conversationHistory.documentReferences
    };

    flowscope.trace(sessionId, {
      id: `hybrid_context_ready_${Date.now()}`,
      type: 'response',
      data: {
        framework: 'hybrid',
        context_elements: Object.keys(context),
        conversation_turns: context.conversationHistory.length,
        document_sources: documents.length
      }
    });

    return context;
  }

  private async generateHybridResponse(query: string, context: any, sessionId: string): Promise<HybridResponse> {
    // Simulate complex multi-step reasoning chain
    flowscope.trace(sessionId, {
      id: `hybrid_response_generation_${Date.now()}`,
      type: 'prompt',
      data: {
        framework: 'hybrid',
        operation: 'response_generation',
        reasoning_strategy: 'multi_step_chain_of_thought',
        input_context: {
          query_length: query.length,
          documents_available: context.retrievedDocuments.length,
          conversation_history: context.conversationHistory.length
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Multi-step reasoning simulation
    const reasoningSteps = [
      'Analyzed user query and conversation context',
      'Retrieved and ranked relevant documents using semantic search',
      'Synthesized information from multiple sources',
      'Applied conversational context to personalize response',
      'Generated comprehensive answer with source attribution'
    ];

    // Generate sophisticated response
    const answer = this.generateContextualAnswer(query, context);
    const confidence = this.calculateResponseConfidence(context);

    const response: HybridResponse = {
      answer,
      confidence,
      reasoning: reasoningSteps,
      sources: context.retrievedDocuments,
      conversationContext: this.getOrCreateContext(sessionId),
      nextSteps: this.suggestNextSteps(query, context)
    };

    flowscope.trace(sessionId, {
      id: `hybrid_response_complete_${Date.now()}`,
      type: 'response',
      data: {
        framework: 'hybrid',
        response_quality: {
          confidence: confidence,
          source_count: response.sources.length,
          reasoning_steps: reasoningSteps.length,
          answer_length: answer.length
        },
        performance_metrics: {
          total_processing_time: '~1200ms',
          retrieval_efficiency: '85%',
          context_utilization: '92%'
        }
      }
    });

    return response;
  }

  private async updateConversationContext(sessionId: string, query: string, response: HybridResponse) {
    flowscope.trace(sessionId, {
      id: `langchain_memory_update_${Date.now()}`,
      type: 'function_call',
      data: {
        framework: 'langchain',
        operation: 'memory_update',
        conversation_length: response.conversationContext.messages.length + 2
      }
    });

    const context = this.getOrCreateContext(sessionId);
    
    // Add user message
    context.messages.push({
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    });

    // Add assistant response
    context.messages.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toISOString()
    });

    // Update document references
    context.documentReferences = [
      ...context.documentReferences,
      ...response.sources.map(s => s.document.id)
    ];

    // Update reasoning chain
    context.reasoningChain = [...context.reasoningChain, ...response.reasoning];

    this.conversationSessions.set(sessionId, context);
  }

  // Helper methods for realistic AI processing simulation
  private classifyIntent(query: string): string {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('how') || queryLower.includes('step')) return 'procedural';
    if (queryLower.includes('what') || queryLower.includes('define')) return 'informational';
    if (queryLower.includes('policy') || queryLower.includes('rule')) return 'policy_inquiry';
    if (queryLower.includes('compare') || queryLower.includes('difference')) return 'comparative';
    return 'general_inquiry';
  }

  private extractEntities(query: string): string[] {
    // Simple entity extraction
    const entities: string[] = [];
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length > 5 && /^[A-Z]/.test(word)) {
        entities.push(word);
      }
    }
    return entities;
  }

  private assessComplexity(query: string): 'low' | 'medium' | 'high' {
    if (query.length < 20) return 'low';
    if (query.split(/[.?!]/).length > 1) return 'high';
    return 'medium';
  }

  private needsDocumentRetrieval(query: string): boolean {
    const infoKeywords = ['policy', 'procedure', 'requirement', 'guideline', 'manual', 'document'];
    return infoKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private isConversational(query: string): boolean {
    const conversationalMarkers = ['thanks', 'follow up', 'also', 'additionally', 'furthermore'];
    return conversationalMarkers.some(marker => query.toLowerCase().includes(marker));
  }

  private calculateHybridRelevance(doc: HybridDocument, analysis: any): number {
    let score = 0;
    
    // Content matching
    const queryTerms = analysis.entities.map((e: string) => e.toLowerCase());
    const content = (doc.title + ' ' + doc.content).toLowerCase();
    
    for (const term of queryTerms) {
      if (content.includes(term)) {
        score += 0.3;
      }
    }

    // Category matching
    if (analysis.intent === 'policy_inquiry' && doc.metadata.category === 'legal') {
      score += 0.4;
    }

    // Importance weighting
    score *= doc.metadata.importance;

    return Math.min(score, 1.0);
  }

  private extractRelevantContent(doc: HybridDocument, analysis: any): string {
    // Extract most relevant sentences
    const sentences = doc.content.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      analysis.entities.some((entity: string) => 
        sentence.toLowerCase().includes(entity.toLowerCase())
      )
    );
    
    return relevantSentences.slice(0, 2).join('. ') + '.' || 
           doc.content.substring(0, 200) + '...';
  }

  private generateContextualAnswer(query: string, context: any): string {
    const docs = context.retrievedDocuments;
    if (docs.length === 0) {
      return 'I don\'t have specific documentation to answer your question, but I can help you find the right resources or connect you with someone who can assist.';
    }

    const primaryDoc = docs[0];
    const category = primaryDoc.document.metadata.category;

    let answer = '';
    
    switch (category) {
      case 'technical':
        answer = `Based on our technical documentation: ${primaryDoc.extractedContent}`;
        break;
      case 'business':
        answer = `According to our business processes: ${primaryDoc.extractedContent}`;
        break;
      case 'hr':
        answer = `Per our HR policies: ${primaryDoc.extractedContent}`;
        break;
      case 'legal':
        answer = `According to company policy: ${primaryDoc.extractedContent}`;
        break;
      default:
        answer = `Based on the available information: ${primaryDoc.extractedContent}`;
    }

    if (docs.length > 1) {
      answer += ` Additional context from ${docs.length - 1} other relevant document(s) supports this information.`;
    }

    return answer;
  }

  private calculateResponseConfidence(context: any): number {
    let confidence = 0.5;
    
    // Boost confidence based on document relevance
    if (context.retrievedDocuments.length > 0) {
      const avgRelevance = context.retrievedDocuments.reduce((sum: number, doc: any) => sum + doc.relevance, 0) / context.retrievedDocuments.length;
      confidence += avgRelevance * 0.4;
    }

    // Boost confidence based on conversation context
    if (context.conversationHistory.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private suggestNextSteps(query: string, context: any): string[] {
    const steps: string[] = [];
    
    if (context.retrievedDocuments.length > 0) {
      steps.push('Would you like more details about any of these policies?');
    }
    
    if (context.conversationHistory.length > 0) {
      steps.push('Do you have follow-up questions about our previous discussion?');
    }
    
    steps.push('Is there anything specific you\'d like me to clarify?');
    
    return steps.slice(0, 3);
  }

  private getOrCreateContext(sessionId: string): ConversationContext {
    if (!this.conversationSessions.has(sessionId)) {
      this.conversationSessions.set(sessionId, {
        messages: [],
        userIntent: 'unknown',
        documentReferences: [],
        reasoningChain: []
      });
    }
    return this.conversationSessions.get(sessionId)!;
  }

  private loadHybridDocuments() {
    const hybridDocs: HybridDocument[] = [
      {
        id: 'tech_001',
        title: 'API Integration Guidelines',
        content: 'Our API follows REST principles with JSON responses. Authentication uses OAuth 2.0. Rate limits apply: 1000 requests per hour for standard accounts. Error codes follow HTTP standards. Webhooks are available for real-time notifications. SDK libraries are provided for major languages.',
        metadata: {
          source: 'Engineering Team',
          category: 'technical',
          importance: 0.9,
          lastUpdated: '2024-02-15'
        }
      },
      {
        id: 'business_001',
        title: 'Customer Onboarding Process',
        content: 'New customer onboarding follows a structured 5-step process: 1) Initial contact and needs assessment, 2) Proposal and contract negotiation, 3) Technical setup and configuration, 4) Training and knowledge transfer, 5) Go-live support and monitoring. Each step has defined deliverables and success criteria.',
        metadata: {
          source: 'Business Operations',
          category: 'business',
          importance: 0.8,
          lastUpdated: '2024-02-10'
        }
      },
      {
        id: 'hr_001',
        title: 'Performance Review Process',
        content: 'Annual performance reviews are conducted in Q4. Process includes: self-assessment, peer feedback, manager evaluation, and goal setting for the following year. Career development plans are created collaboratively. Compensation adjustments are based on performance, market data, and budget allocation.',
        metadata: {
          source: 'Human Resources',
          category: 'hr',
          importance: 0.7,
          lastUpdated: '2024-01-25'
        }
      },
      {
        id: 'legal_001',
        title: 'Data Privacy and GDPR Compliance',
        content: 'Our data privacy framework ensures GDPR compliance through: data minimization principles, explicit consent mechanisms, right to erasure implementation, data portability features, and regular privacy impact assessments. All customer data is encrypted at rest and in transit.',
        metadata: {
          source: 'Legal Department',
          category: 'legal',
          importance: 1.0,
          lastUpdated: '2024-02-20'
        }
      }
    ];

    for (const doc of hybridDocs) {
      this.documents.set(doc.id, doc);
    }

    console.log(`📚 Loaded ${hybridDocs.length} hybrid documents`);
  }

  getSystemStats() {
    return {
      documents: this.documents.size,
      activeSessions: this.conversationSessions.size,
      frameworks: ['LangChain', 'LlamaIndex'],
      capabilities: [
        'Hybrid document retrieval',
        'Conversation context management',
        'Multi-step reasoning chains',
        'Cross-framework observability'
      ]
    };
  }
}

// Express server for the hybrid RAG system
class HybridRAGServer {
  private app: express.Application;
  private hybridSystem: HybridRAGSystem;

  constructor() {
    this.app = express();
    this.hybridSystem = new HybridRAGSystem();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        system: this.hybridSystem.getSystemStats()
      });
    });

    this.app.post('/api/chat', async (req, res) => {
      try {
        const { query, sessionId, userId } = req.body;

        if (!query || !sessionId) {
          return res.status(400).json({
            error: 'Missing required fields: query and sessionId'
          });
        }

        const response = await this.hybridSystem.processQuery(query, sessionId, userId);

        res.json({
          success: true,
          data: response,
          metadata: {
            timestamp: new Date().toISOString(),
            sessionId,
            framework: 'hybrid_langchain_llamaindex'
          }
        });

      } catch (error) {
        console.error('Hybrid Chat API Error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.app.get('/api/debug/flowscope', (req, res) => {
      res.json({
        status: 'active',
        frameworks: ['LangChain', 'LlamaIndex'],
        integration: 'hybrid',
        traceCount: flowscope.getTraces().length,
        features: [
          'Multi-framework trace correlation',
          'End-to-end pipeline visibility',
          'Cross-framework performance monitoring',
          'Hybrid reasoning chain debugging'
        ]
      });
    });

    this.app.post('/api/debug/generate-hybrid-traces', async (req, res) => {
      try {
        const testScenarios = [
          {
            query: 'What is our API integration process?',
            sessionId: 'hybrid_test_1',
            description: 'Technical documentation retrieval'
          },
          {
            query: 'How does customer onboarding work and what are the legal requirements?',
            sessionId: 'hybrid_test_2', 
            description: 'Multi-domain query spanning business and legal'
          },
          {
            query: 'Can you explain the performance review process? Also, what are our data privacy policies?',
            sessionId: 'hybrid_test_3',
            description: 'Complex multi-part conversational query'
          }
        ];

        const results: Array<{scenario: any, result: HybridResponse}> = [];
        for (const scenario of testScenarios) {
          const result = await this.hybridSystem.processQuery(
            scenario.query,
            scenario.sessionId,
            'demo_user'
          );
          results.push({ scenario, result });
        }

        res.json({ 
          success: true, 
          message: 'Generated hybrid framework traces', 
          data: results 
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate hybrid traces' });
      }
    });
  }

  start(port: number = 3005) {
    return new Promise<void>((resolve) => {
      this.app.listen(port, () => {
        console.log(`🔀 Hybrid RAG System running on http://localhost:${port}`);
        console.log(`📊 FlowScope debugging enabled for LangChain + LlamaIndex`);
        console.log(`\n🧪 Test the hybrid system:`);
        console.log(`  curl -X POST http://localhost:${port}/api/chat \\`);
        console.log(`    -H "Content-Type: application/json" \\`);
        console.log(`    -d '{"query":"What is our API process?","sessionId":"test_1"}'`);
        console.log(`\n📈 Generate hybrid traces:`);
        console.log(`  curl -X POST http://localhost:${port}/api/debug/generate-hybrid-traces`);
        resolve();
      });
    });
  }
}

async function main() {
  try {
    await flowscope.init();
    console.log('✅ FlowScope SDK initialized for hybrid framework debugging');

    const server = new HybridRAGServer();
    await server.start(3005);

  } catch (error) {
    console.error('❌ Failed to start hybrid RAG system:', error);
    process.exit(1);
  }
}

export { HybridRAGSystem, HybridRAGServer };

if (require.main === module) {
  main();
}
