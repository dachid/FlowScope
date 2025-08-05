#!/usr/bin/env python3
"""
FlowScope Python SDK - Manual SDK Example

This example demonstrates using FlowScope decorators and context managers
for fine-grained control over tracing. Perfect for custom workflows
and when you need precise control over what gets traced.
"""

import asyncio
import sys
import os
import time
import random

# Add the SDK to path for demo purposes
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'python-sdk'))

# Import FlowScope for manual tracing
import flowscope
from flowscope.context import with_context, add_context_tag, set_context_result

# Configure FlowScope
flowscope.configure(
    session_id="manual-sdk-demo",
    include_inputs=True,
    include_outputs=True
)

# Example AI service class using decorators
class AIService:
    """Example AI service demonstrating decorator usage."""
    
    def __init__(self, model_name="gpt-3.5-turbo"):
        self.model_name = model_name
        print(f"🤖 AIService initialized with {model_name}")
        
    @flowscope.trace("ai_service.generate_response")
    def generate_response(self, prompt, temperature=0.7):
        """Generate a response with automatic tracing via decorator."""
        print(f"🎯 Generating response for prompt: {prompt[:50]}...")
        
        # Simulate API call
        time.sleep(0.1 + random.random() * 0.3)
        
        if "error" in prompt.lower():
            raise Exception("Simulated AI API error")
            
        response = f"AI Response ({self.model_name}, temp={temperature}): {prompt}"
        return response
        
    @flowscope.trace("ai_service.analyze_sentiment")
    def analyze_sentiment(self, text):
        """Analyze sentiment with tracing."""
        print(f"📊 Analyzing sentiment for: {text[:30]}...")
        
        time.sleep(0.05 + random.random() * 0.1)
        
        # Simple mock sentiment analysis
        if any(word in text.lower() for word in ["happy", "good", "great", "excellent"]):
            sentiment = "positive"
            score = 0.8 + random.random() * 0.2
        elif any(word in text.lower() for word in ["sad", "bad", "terrible", "awful"]):
            sentiment = "negative" 
            score = random.random() * 0.3
        else:
            sentiment = "neutral"
            score = 0.4 + random.random() * 0.2
            
        return {"sentiment": sentiment, "score": score}
        
    @flowscope.trace("ai_service.batch_process")
    async def batch_process(self, items):
        """Process items in batch with async tracing."""
        print(f"⚡ Batch processing {len(items)} items")
        
        results = []
        for i, item in enumerate(items):
            print(f"  Processing item {i+1}/{len(items)}")
            await asyncio.sleep(0.1)  # Simulate async work
            results.append(f"Processed: {item}")
            
        return results

class DatabaseService:
    """Mock database service for context manager demos."""
    
    def __init__(self):
        self.connected = False
        print("🗄️ DatabaseService initialized")
        
    def connect(self):
        time.sleep(0.1)  # Simulate connection time
        self.connected = True
        print("✅ Database connected")
        
    def query(self, sql):
        if not self.connected:
            raise Exception("Database not connected")
        time.sleep(0.05 + random.random() * 0.1)
        return [{"id": i, "data": f"row_{i}"} for i in range(3)]
        
    def disconnect(self):
        self.connected = False
        print("🔌 Database disconnected")

def demo_decorator_tracing():
    """Demonstrate decorator-based tracing."""
    print("\n--- Demo 1: Decorator-Based Tracing ---")
    
    ai_service = AIService("gpt-4")
    
    # All these method calls are automatically traced via decorators
    prompts = [
        "Explain quantum computing in simple terms",
        "What are the benefits of renewable energy?",
        "How does machine learning work?",
        "Generate an error for testing"  # Will trigger error tracing
    ]
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n--- Request {i} ---")
        try:
            response = ai_service.generate_response(prompt, temperature=0.8)
            print(f"✅ Response: {response[:80]}...")
            
            # Also analyze sentiment
            sentiment = ai_service.analyze_sentiment(response)
            print(f"📊 Sentiment: {sentiment}")
            
        except Exception as e:
            print(f"❌ Error handled: {e}")
            
        time.sleep(0.3)

def demo_context_managers():
    """Demonstrate context manager usage."""
    print("\n--- Demo 2: Context Manager Usage ---")
    
    db = DatabaseService()
    
    # Complex workflow with nested contexts
    with with_context("user_workflow", {"user_id": "user_123"}) as workflow_ctx:
        workflow_ctx.set_tag("workflow_type", "data_processing")
        
        # Database operations context
        with with_context("database_operations") as db_ctx:
            db_ctx.set_tag("operation_type", "user_data_fetch")
            
            try:
                db.connect()
                db_ctx.set_tag("connection_status", "connected")
                
                # Query user data
                with with_context("user_query") as query_ctx:
                    query_ctx.set_tag("table", "users")
                    user_data = db.query("SELECT * FROM users WHERE id = 'user_123'")
                    query_ctx.set_result({"rows_found": len(user_data)})
                    
                # Query preferences
                with with_context("preferences_query") as pref_ctx:
                    pref_ctx.set_tag("table", "preferences")
                    preferences = db.query("SELECT * FROM preferences WHERE user_id = 'user_123'")
                    pref_ctx.set_result({"preferences_count": len(preferences)})
                    
                db_ctx.set_result({
                    "user_data": user_data,
                    "preferences": preferences
                })
                
            finally:
                db.disconnect()
                
        # Data processing context
        with with_context("data_processing") as process_ctx:
            process_ctx.set_tag("processing_type", "aggregation")
            
            # Simulate data processing
            time.sleep(0.2)
            processed_data = {
                "user_id": "user_123",
                "total_records": len(user_data) + len(preferences),
                "processed_at": time.time()
            }
            
            process_ctx.set_result(processed_data)
            
        workflow_ctx.set_result({
            "status": "completed",
            "user_id": "user_123",
            "data": processed_data
        })
        
    print("✅ Complex workflow completed with nested tracing")

async def demo_async_context():
    """Demonstrate async context managers and tracing."""
    print("\n--- Demo 3: Async Context & Tracing ---")
    
    ai_service = AIService("gpt-3.5-turbo")
    
    # Async batch processing with context
    with with_context("async_batch_workflow") as batch_ctx:
        batch_ctx.set_tag("workflow_type", "async_processing")
        
        items = [
            "Summarize the benefits of cloud computing",
            "Explain containerization technology", 
            "Describe microservices architecture"
        ]
        
        batch_ctx.set_tag("batch_size", len(items))
        
        # Process batch asynchronously (this method is decorated)
        results = await ai_service.batch_process(items)
        
        batch_ctx.set_result({
            "items_processed": len(results),
            "results": results
        })
        
    print("✅ Async batch processing completed")

def demo_manual_tracing():
    """Demonstrate manual trace management."""
    print("\n--- Demo 4: Manual Trace Management ---")
    
    # Manual trace creation and management
    with flowscope.trace("custom_workflow", metadata={"type": "manual_demo"}) as trace:
        
        # Step 1: Data preparation
        with flowscope.trace("data_preparation") as prep_trace:
            print("🔧 Preparing data...")
            time.sleep(0.1)
            data = {"items": [1, 2, 3, 4, 5], "metadata": {"source": "manual"}}
            prep_trace.set_output(data)
            
        # Step 2: Processing
        with flowscope.trace("data_processing") as proc_trace:
            print("⚙️ Processing data...")
            proc_trace.set_input(data)
            time.sleep(0.15)
            
            processed = []
            for item in data["items"]:
                # Individual item processing
                with flowscope.trace("item_processing") as item_trace:
                    item_trace.set_input(item)
                    result = item * 2 + 1
                    item_trace.set_output(result)
                    processed.append(result)
                    
            proc_trace.set_output({"processed_items": processed})
            
        # Step 3: Validation
        with flowscope.trace("validation") as val_trace:
            print("✅ Validating results...")
            time.sleep(0.05)
            is_valid = all(x > 0 for x in processed)
            val_trace.set_output({"is_valid": is_valid, "item_count": len(processed)})
            
        trace.set_output({
            "workflow_status": "completed",
            "final_results": processed,
            "validation_passed": is_valid
        })
        
    print("✅ Manual workflow tracing completed")

def main():
    """Main demo function showcasing manual SDK usage."""
    print("🚀 FlowScope Python SDK - Manual SDK Demo")
    print("=" * 60)
    print("This demo shows fine-grained control over tracing using")
    print("decorators and context managers.\n")
    
    # Create session
    session_id = flowscope.create_session("manual-sdk-session", {
        "demo_type": "manual_sdk",
        "language": "python",
        "integration_path": "decorators_and_contexts"
    })
    
    # Demo 1: Decorator usage
    demo_decorator_tracing()
    
    # Demo 2: Context managers
    demo_context_managers()
    
    # Demo 3: Async operations
    print("\n--- Running Async Demo ---")
    asyncio.run(demo_async_context())
    
    # Demo 4: Manual trace management
    demo_manual_tracing()
    
    # Show manual SDK capabilities
    print("\n📊 Manual SDK Summary:")
    print(f"Session ID: {session_id}")
    print("✅ Decorator-based method tracing")
    print("✅ Context managers for complex workflows")
    print("✅ Async operation support")
    print("✅ Manual trace management")
    print("✅ Nested operation tracking")
    
    # Show trace statistics
    client = flowscope.get_client()
    print(f"\n📈 Total traces captured: {len(client.traces)}")
    
    # Group traces by operation type
    trace_types = {}
    for trace in client.traces:
        operation = trace.operation.split('.')[-1] if '.' in trace.operation else trace.operation
        trace_types[operation] = trace_types.get(operation, 0) + 1
        
    print("📊 Trace breakdown:")
    for operation, count in sorted(trace_types.items()):
        print(f"  • {operation}: {count} traces")
    
    # Flush traces
    print("\n🚀 Flushing traces to FlowScope backend...")
    success = flowscope.flush()
    if success:
        print("✅ All traces sent successfully")
    else:
        print("❌ Some traces failed to send")
    
    print("\n🎉 Manual SDK demo completed!")
    print("\n💡 Key Benefits Demonstrated:")
    print("  ✅ Fine-grained control - trace exactly what you need")
    print("  ✅ Rich context - nested operations and custom metadata")
    print("  ✅ Flexible usage - decorators, context managers, or manual")
    print("  ✅ Async support - full asyncio compatibility")

if __name__ == "__main__":
    main()
