/**
 * Enterprise Document Search - Real-World LlamaIndex Application
 * 
 * This demonstrates FlowScope integration with a realistic RAG (Retrieval-Augmented Generation)
 * system that can search and answer questions from a document collection.
 * 
 * Features:
 * - Document ingestion and indexing
 * - Semantic search with retrieval
 * - Question answering with context
 * - Multi-step reasoning chains
 * 
 * FlowScope Integration:
 * - Trace document indexing processes
 * - Monitor retrieval performance
 * - Debug question-answering chains
 * - Track relevance scoring
 */

import { FlowScopeSDK } from '@flowscope/sdk';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

// Initialize FlowScope SDK with automatic LlamaIndex detection
const flowscope = new FlowScopeSDK({
  projectId: 'document-search-rag',
  debug: true,
  autoDetect: true
});

// Document and search interfaces
interface Document {
  id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    type: 'policy' | 'manual' | 'faq' | 'guide';
    lastUpdated: string;
    wordCount: number;
  };
}

interface SearchResult {
  document: Document;
  relevanceScore: number;
  matchedChunks: string[];
}

interface QueryResponse {
  answer: string;
  confidence: number;
  sources: SearchResult[];
  reasoning: string[];
  followUpQuestions?: string[];
}

class DocumentSearchRAG {
  private documents: Map<string, Document> = new Map();
  private documentIndex: Map<string, string[]> = new Map(); // Simple keyword index
  private sessionHistory: Map<string, any[]> = new Map();

  constructor() {
    console.log('📚 Document Search RAG initialized');
    this.loadSampleDocuments();
  }

  async searchDocuments(
    query: string,
    sessionId?: string,
    limit: number = 5
  ): Promise<QueryResponse> {
    try {
      const session = sessionId || `search_${Date.now()}`;
      
      // Start FlowScope session
      flowscope.startSession(session, {
        query: query.substring(0, 100),
        timestamp: new Date().toISOString(),
        operation: 'document_search'
      });

      // Step 1: Query preprocessing
      flowscope.trace(session, {
        id: `query_preprocessing_${Date.now()}`,
        type: 'prompt',
        data: {
          raw_query: query,
          preprocessing: 'tokenization and normalization'
        },
        metadata: {
          step: 'preprocessing',
          query_length: query.length
        }
      });

      const processedQuery = this.preprocessQuery(query);

      // Step 2: Document retrieval
      flowscope.trace(session, {
        id: `document_retrieval_${Date.now()}`,
        type: 'function_call',
        data: {
          function: 'retrieveRelevantDocuments',
          input: processedQuery,
          index_size: this.documents.size
        }
      });

      const retrievalResults = await this.retrieveRelevantDocuments(processedQuery, limit);
      
      flowscope.trace(session, {
        id: `retrieval_results_${Date.now()}`,
        type: 'response',
        data: {
          retrieved_count: retrievalResults.length,
          top_scores: retrievalResults.map(r => r.relevanceScore),
          document_ids: retrievalResults.map(r => r.document.id)
        }
      });

      // Step 3: Context preparation
      const context = this.prepareContext(retrievalResults);
      
      flowscope.trace(session, {
        id: `context_preparation_${Date.now()}`,
        type: 'function_call',
        data: {
          context_length: context.length,
          source_documents: retrievalResults.length,
          context_preview: context.substring(0, 200) + '...'
        }
      });

      // Step 4: Answer generation (simulated LLM call)
      const answer = await this.generateAnswer(query, context, retrievalResults);
      
      flowscope.trace(session, {
        id: `answer_generation_${Date.now()}`,
        type: 'response',
        data: {
          answer,
          confidence: answer.confidence,
          reasoning_steps: answer.reasoning.length
        }
      });

      // Store in session history
      this.updateSessionHistory(session, {
        query,
        answer: answer.answer,
        timestamp: new Date().toISOString(),
        sourceCount: retrievalResults.length
      });

      return answer;

    } catch (error) {
      console.error('Error in document search:', error);
      
      // Trace the error
      flowscope.trace(sessionId || 'error_session', {
        id: `search_error_${Date.now()}`,
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query,
          operation: 'document_search'
        }
      });

      return {
        answer: 'I apologize, but I encountered an error while searching the documents. Please try rephrasing your question.',
        confidence: 0.1,
        sources: [],
        reasoning: ['Error occurred during document search'],
        followUpQuestions: ['Could you rephrase your question?', 'Would you like to try a different search term?']
      };
    } finally {
      flowscope.endSession();
    }
  }

  private preprocessQuery(query: string): string[] {
    // Simple preprocessing - in real implementation would use proper NLP
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private async retrieveRelevantDocuments(
    queryTerms: string[], 
    limit: number
  ): Promise<SearchResult[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const results: SearchResult[] = [];

    for (const [docId, doc] of this.documents) {
      const score = this.calculateRelevanceScore(doc, queryTerms);
      if (score > 0.1) {
        const matchedChunks = this.findMatchingChunks(doc.content, queryTerms);
        results.push({
          document: doc,
          relevanceScore: score,
          matchedChunks
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private calculateRelevanceScore(doc: Document, queryTerms: string[]): number {
    const content = (doc.title + ' ' + doc.content).toLowerCase();
    let score = 0;
    let matches = 0;

    for (const term of queryTerms) {
      if (content.includes(term)) {
        matches++;
        // Title matches get higher score
        if (doc.title.toLowerCase().includes(term)) {
          score += 0.3;
        }
        // Content matches
        const termCount = (content.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(termCount * 0.1, 0.5);
      }
    }

    // Normalize by query length
    return Math.min(score / queryTerms.length, 1.0);
  }

  private findMatchingChunks(content: string, queryTerms: string[]): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const matchingChunks: string[] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (queryTerms.some(term => lowerSentence.includes(term))) {
        matchingChunks.push(sentence.trim());
      }
    }

    return matchingChunks.slice(0, 3); // Return top 3 matching chunks
  }

  private prepareContext(results: SearchResult[]): string {
    let context = '';
    for (const result of results) {
      context += `\n--- ${result.document.title} ---\n`;
      context += result.matchedChunks.join(' ') || result.document.content.substring(0, 300);
      context += '\n';
    }
    return context;
  }

  private async generateAnswer(
    query: string,
    context: string,
    sources: SearchResult[]
  ): Promise<QueryResponse> {
    // Simulate LLM processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple rule-based answer generation (in real implementation would use LLM)
    const queryLower = query.toLowerCase();
    let answer = '';
    let confidence = 0.8;
    const reasoning = ['Analyzed query intent', 'Retrieved relevant documents', 'Generated response from context'];

    if (queryLower.includes('policy') || queryLower.includes('rule')) {
      answer = `Based on our policy documents, ${this.extractKeyInfo(context, ['policy', 'requirement', 'must', 'should'])}`;
      reasoning.push('Identified policy-related query');
    } else if (queryLower.includes('how') || queryLower.includes('step')) {
      answer = `Here's how to proceed: ${this.extractKeyInfo(context, ['step', 'process', 'procedure', 'method'])}`;
      reasoning.push('Identified procedural query');
    } else if (queryLower.includes('what') || queryLower.includes('define')) {
      answer = `${this.extractKeyInfo(context, ['definition', 'meaning', 'refers to', 'means'])}`;
      reasoning.push('Identified definitional query');
    } else {
      answer = `Based on the available documentation: ${this.extractKeyInfo(context, [])}`;
      confidence = 0.6;
    }

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(query, sources);

    return {
      answer: answer || 'I found relevant documents but need more specific information to provide a detailed answer.',
      confidence,
      sources,
      reasoning,
      followUpQuestions
    };
  }

  private extractKeyInfo(context: string, keywords: string[]): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (keywords.length > 0) {
      // Find sentences containing keywords
      const relevantSentences = sentences.filter(sentence => 
        keywords.some(keyword => sentence.toLowerCase().includes(keyword))
      );
      if (relevantSentences.length > 0) {
        return relevantSentences.slice(0, 2).join('. ') + '.';
      }
    }
    
    // Fallback to first meaningful sentences
    return sentences.slice(0, 2).join('. ') + '.';
  }

  private generateFollowUpQuestions(query: string, sources: SearchResult[]): string[] {
    const questions: string[] = [];
    
    if (sources.length > 0) {
      const docTypes = [...new Set(sources.map(s => s.document.metadata.type))];
      
      if (docTypes.includes('policy')) {
        questions.push('Would you like more details about the specific policy requirements?');
      }
      if (docTypes.includes('manual')) {
        questions.push('Do you need step-by-step instructions for this process?');
      }
      if (docTypes.includes('faq')) {
        questions.push('Are there other common questions about this topic?');
      }
    }
    
    questions.push('Would you like me to search for more specific information?');
    
    return questions.slice(0, 3);
  }

  private loadSampleDocuments() {
    const sampleDocs: Document[] = [
      {
        id: 'policy_001',
        title: 'Employee Handbook - Remote Work Policy',
        content: `Remote work is permitted for eligible employees with manager approval. Requirements include: stable internet connection, dedicated workspace, availability during core hours (9 AM - 3 PM local time). Equipment will be provided by the company. Regular check-ins are mandatory. Performance standards remain unchanged. Security protocols must be followed for all company data access.`,
        metadata: {
          source: 'HR Department',
          type: 'policy',
          lastUpdated: '2024-01-15',
          wordCount: 65
        }
      },
      {
        id: 'manual_001',
        title: 'IT Setup Manual - VPN Configuration',
        content: `To configure VPN access: 1) Download the company VPN client from the IT portal. 2) Install using administrator privileges. 3) Use your employee ID and the temporary password sent via email. 4) Change password on first login. 5) Test connection by accessing internal resources. 6) Contact IT support if issues persist. VPN must be used for all remote access to company systems.`,
        metadata: {
          source: 'IT Department',
          type: 'manual',
          lastUpdated: '2024-02-01',
          wordCount: 78
        }
      },
      {
        id: 'faq_001',
        title: 'Benefits FAQ - Health Insurance',
        content: `Common questions about health insurance: Coverage begins on your start date if enrolled during onboarding. Open enrollment occurs annually in November. You can add dependents during life events (marriage, birth, adoption). Premiums are deducted pre-tax from payroll. HSA contributions are available with high-deductible plans. Contact HR for specific coverage questions.`,
        metadata: {
          source: 'HR Department',
          type: 'faq',
          lastUpdated: '2024-01-30',
          wordCount: 72
        }
      },
      {
        id: 'guide_001',
        title: 'Security Guidelines - Password Management',
        content: `Password requirements: minimum 12 characters, mix of uppercase, lowercase, numbers, and symbols. No reuse of last 10 passwords. Multi-factor authentication required for all systems. Password manager is recommended and provided by the company. Report suspected compromises immediately. Regular security training is mandatory for all employees.`,
        metadata: {
          source: 'Security Team',
          type: 'guide',
          lastUpdated: '2024-02-10',
          wordCount: 58
        }
      },
      {
        id: 'policy_002',
        title: 'Leave Policy - Vacation and Sick Time',
        content: `Vacation accrual: 15 days annually for first 5 years, 20 days after 5 years, 25 days after 10 years. Sick leave: 10 days annually, unused time carries over up to 40 days maximum. Parental leave: 12 weeks paid, additional unpaid time available. Bereavement leave: 5 days for immediate family. Request time off through the HR portal with manager approval required.`,
        metadata: {
          source: 'HR Department',
          type: 'policy',
          lastUpdated: '2024-01-20',
          wordCount: 82
        }
      }
    ];

    for (const doc of sampleDocs) {
      this.documents.set(doc.id, doc);
    }

    console.log(`📄 Loaded ${sampleDocs.length} sample documents`);
  }

  private updateSessionHistory(sessionId: string, interaction: any) {
    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, []);
    }
    this.sessionHistory.get(sessionId)!.push(interaction);
  }

  getSessionHistory(sessionId: string) {
    return this.sessionHistory.get(sessionId) || [];
  }

  getDocumentStats() {
    const stats = {
      totalDocuments: this.documents.size,
      documentTypes: {} as Record<string, number>,
      totalWords: 0
    };

    for (const doc of this.documents.values()) {
      stats.documentTypes[doc.metadata.type] = (stats.documentTypes[doc.metadata.type] || 0) + 1;
      stats.totalWords += doc.metadata.wordCount;
    }

    return stats;
  }
}

// Express server for the document search system
class DocumentSearchServer {
  private app: express.Application;
  private rag: DocumentSearchRAG;

  constructor() {
    this.app = express();
    this.rag = new DocumentSearchRAG();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        documents: this.rag.getDocumentStats()
      });
    });

    // Main search endpoint
    this.app.post('/api/search', async (req, res) => {
      try {
        const { query, sessionId, limit } = req.body;

        if (!query) {
          return res.status(400).json({
            error: 'Missing required field: query'
          });
        }

        const response = await this.rag.searchDocuments(
          query,
          sessionId,
          limit || 5
        );

        res.json({
          success: true,
          data: response,
          metadata: {
            timestamp: new Date().toISOString(),
            sessionId: sessionId || 'auto-generated',
            queryLength: query.length
          }
        });

      } catch (error) {
        console.error('Search API Error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get session history
    this.app.get('/api/search/history/:sessionId', (req, res) => {
      try {
        const { sessionId } = req.params;
        const history = this.rag.getSessionHistory(sessionId);
        res.json({ success: true, data: history });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get session history' });
      }
    });

    // Document stats
    this.app.get('/api/documents/stats', (req, res) => {
      res.json({ 
        success: true, 
        data: this.rag.getDocumentStats() 
      });
    });

    // FlowScope debugging endpoints
    this.app.get('/api/debug/flowscope', (req, res) => {
      res.json({
        status: 'active',
        sdkInitialized: true,
        traceCount: flowscope.getTraces().length,
        features: [
          'Document retrieval tracing',
          'RAG pipeline debugging',
          'Query preprocessing monitoring',
          'Answer generation tracking'
        ]
      });
    });

    // Generate sample searches for testing
    this.app.post('/api/debug/generate-searches', async (req, res) => {
      try {
        const testQueries = [
          'What is the remote work policy?',
          'How do I configure VPN access?',
          'When does health insurance coverage begin?',
          'What are the password requirements?',
          'How many vacation days do I get?'
        ];

        const results: Array<{query: string, result: QueryResponse}> = [];
        for (const query of testQueries) {
          const result = await this.rag.searchDocuments(
            query,
            `demo_${Date.now()}_${Math.random()}`
          );
          results.push({ query, result });
        }

        res.json({ 
          success: true, 
          message: 'Generated sample search traces', 
          data: results 
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate search traces' });
      }
    });
  }

  start(port: number = 3004) {
    return new Promise<void>((resolve) => {
      this.app.listen(port, () => {
        console.log(`📚 Document Search RAG running on http://localhost:${port}`);
        console.log(`📊 FlowScope debugging enabled`);
        console.log(`\n🧪 Test the search:`);
        console.log(`  curl -X POST http://localhost:${port}/api/search \\`);
        console.log(`    -H "Content-Type: application/json" \\`);
        console.log(`    -d '{"query":"What is the remote work policy?"}'`);
        console.log(`\n📈 Generate sample searches:`);
        console.log(`  curl -X POST http://localhost:${port}/api/debug/generate-searches`);
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
    const server = new DocumentSearchServer();
    await server.start(3004);

  } catch (error) {
    console.error('❌ Failed to start document search RAG:', error);
    process.exit(1);
  }
}

// Export for testing
export { DocumentSearchRAG, DocumentSearchServer };

// Run if this is the main module
if (require.main === module) {
  main();
}
