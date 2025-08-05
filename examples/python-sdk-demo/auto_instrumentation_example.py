#!/usr/bin/env python3
"""
FlowScope Python SDK - Auto-Instrumentation Example

This example demonstrates zero-configuration automatic tracing.
No code changes needed - just enable auto-instrumentation and 
your existing LangChain/LlamaIndex code is automatically traced.
"""

import asyncio
import sys
import os
import time
import random

# Add the SDK to path for demo purposes
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'python-sdk'))

# Enable auto-instrumentation BEFORE importing any AI frameworks
import flowscope.auto
flowscope.auto.init_auto(frameworks=["langchain", "llamaindex"])

# Configure FlowScope
import flowscope
flowscope.configure(
    session_id="auto-instrumentation-demo",
    include_inputs=True,
    include_outputs=True
)

# Mock LangChain classes for demo (in real usage, these would be actual LangChain imports)
class MockLLM:
    """Mock LLM for demonstration purposes."""
    def __init__(self, model_name="gpt-3.5-turbo"):
        self.model_name = model_name
        
    def __call__(self, prompt):
        time.sleep(0.1 + random.random() * 0.2)  # Simulate API call
        if "error" in prompt.lower():
            raise Exception("Simulated LLM API error")
        return f"Mock response to: {prompt}"

class MockLLMChain:
    """Mock LLMChain that simulates the real LangChain LLMChain."""
    def __init__(self, llm, prompt_template):
        self.llm = llm
        self.prompt_template = prompt_template
        print(f"🔗 MockLLMChain initialized with {llm.model_name}")
        
    def run(self, **kwargs):
        prompt = self.prompt_template.format(**kwargs)
        print(f"📝 LLMChain.run() called with prompt: {prompt[:50]}...")
        result = self.llm(prompt)
        return result
        
    def call(self, inputs):
        prompt = self.prompt_template.format(**inputs)
        print(f"📞 LLMChain.call() called")
        result = self.llm(prompt)
        return {"text": result}
        
    async def arun(self, **kwargs):
        prompt = self.prompt_template.format(**kwargs)
        print(f"🔄 LLMChain.arun() called (async)")
        await asyncio.sleep(0.1 + random.random() * 0.2)
        if "error" in prompt.lower():
            raise Exception("Simulated async LLM API error")
        return f"Async mock response to: {prompt}"

class MockConversationChain:
    """Mock ConversationChain for demonstration."""
    def __init__(self, llm):
        self.llm = llm
        self.memory = []
        print(f"💬 MockConversationChain initialized")
        
    def predict(self, input):
        print(f"🔮 ConversationChain.predict() called with: {input}")
        context = " ".join(self.memory[-3:])  # Last 3 exchanges
        full_prompt = f"Context: {context}\nHuman: {input}\nAI:"
        response = self.llm(full_prompt)
        self.memory.append(f"Human: {input}")
        self.memory.append(f"AI: {response}")
        return response

# Simulate auto-instrumentation by manually applying tracing
# (In real usage, this would happen automatically via import hooks)
def apply_mock_instrumentation():
    """Apply mock instrumentation to demonstrate auto-instrumentation behavior."""
    
    # Patch MockLLMChain methods
    original_run = MockLLMChain.run
    original_call = MockLLMChain.call
    original_arun = MockLLMChain.arun
    
    def traced_run(self, **kwargs):
        with flowscope.trace("langchain.LLMChain.run", metadata={"framework": "langchain", "auto_instrumented": True}):
            return original_run(self, **kwargs)
            
    def traced_call(self, inputs):
        with flowscope.trace("langchain.LLMChain.call", metadata={"framework": "langchain", "auto_instrumented": True}):
            return original_call(self, inputs)
            
    async def traced_arun(self, **kwargs):
        with flowscope.trace("langchain.LLMChain.arun", metadata={"framework": "langchain", "auto_instrumented": True}):
            return await original_arun(self, **kwargs)
    
    MockLLMChain.run = traced_run
    MockLLMChain.call = traced_call
    MockLLMChain.arun = traced_arun
    
    # Patch MockConversationChain methods
    original_predict = MockConversationChain.predict
    
    def traced_predict(self, input):
        with flowscope.trace("langchain.ConversationChain.predict", metadata={"framework": "langchain", "auto_instrumented": True}):
            return original_predict(self, input)
    
    MockConversationChain.predict = traced_predict
    
    print("✅ Mock auto-instrumentation applied to LangChain classes")

def demo_llm_chain():
    """Demonstrate auto-instrumented LLMChain usage."""
    print("\n--- Demo 1: LLMChain Auto-Instrumentation ---")
    
    # Create LLM and chain (this would be your existing code)
    llm = MockLLM("gpt-3.5-turbo")
    prompt_template = "Answer the following question: {question}"
    chain = MockLLMChain(llm=llm, prompt_template=prompt_template)
    
    # Run some queries (these calls are automatically traced)
    questions = [
        "What is artificial intelligence?",
        "Explain machine learning in simple terms",
        "How does natural language processing work?",
        "Please generate an error"  # This will trigger error tracing
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n--- Query {i} ---")
        try:
            result = chain.run(question=question)
            print(f"✅ Result: {result}")
        except Exception as e:
            print(f"❌ Error handled: {e}")
            
        time.sleep(0.5)  # Small delay between calls

def demo_conversation_chain():
    """Demonstrate auto-instrumented ConversationChain usage."""
    print("\n--- Demo 2: ConversationChain Auto-Instrumentation ---")
    
    llm = MockLLM("gpt-4")
    conversation = MockConversationChain(llm=llm)
    
    # Have a conversation (all calls automatically traced)
    messages = [
        "Hello, my name is Alice",
        "What is my name?",
        "Can you help me with Python programming?",
        "Thank you for your help"
    ]
    
    for i, message in enumerate(messages, 1):
        print(f"\n--- Turn {i} ---")
        try:
            response = conversation.predict(message)
            print(f"✅ Response: {response}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
        time.sleep(0.3)

async def demo_async_operations():
    """Demonstrate auto-instrumented async operations."""
    print("\n--- Demo 3: Async Auto-Instrumentation ---")
    
    llm = MockLLM("gpt-3.5-turbo")
    prompt_template = "Analyze this async query: {query}"
    chain = MockLLMChain(llm=llm, prompt_template=prompt_template)
    
    # Async operations (automatically traced)
    queries = [
        "What are the benefits of async programming?",
        "How does Python's asyncio work?",
        "Explain concurrent vs parallel execution"
    ]
    
    tasks = []
    for query in queries:
        task = chain.arun(query=query)
        tasks.append(task)
    
    # Wait for all async operations to complete
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for i, result in enumerate(results, 1):
            if isinstance(result, Exception):
                print(f"❌ Async query {i} failed: {result}")
            else:
                print(f"✅ Async query {i} result: {result}")
    except Exception as e:
        print(f"❌ Async error: {e}")

def main():
    """Main demo function showcasing auto-instrumentation."""
    print("🚀 FlowScope Python SDK - Auto-Instrumentation Demo")
    print("=" * 60)
    print("This demo shows how existing LangChain code gets automatically traced")
    print("with zero code changes when auto-instrumentation is enabled.\n")
    
    # Apply mock instrumentation (this simulates what real auto-instrumentation does)
    apply_mock_instrumentation()
    
    # Create a session
    session_id = flowscope.create_session("auto-instrumentation-session", {
        "demo_type": "auto_instrumentation",
        "language": "python",
        "frameworks": ["langchain"]
    })
    
    # Demo 1: Basic LLMChain usage
    demo_llm_chain()
    
    # Demo 2: Conversation chain usage
    demo_conversation_chain()
    
    # Demo 3: Async operations
    print("\n--- Running Async Demo ---")
    asyncio.run(demo_async_operations())
    
    # Show instrumentation stats
    print("\n📊 Auto-Instrumentation Summary:")
    print(f"Session ID: {session_id}")
    print("✅ All LangChain operations automatically traced")
    print("✅ Zero code changes required")
    print("✅ Async and sync operations supported")
    print("✅ Error conditions properly captured")
    
    # Flush traces
    print("\n🚀 Flushing traces to FlowScope backend...")
    success = flowscope.flush()
    if success:
        print("✅ All traces sent successfully")
    else:
        print("❌ Some traces failed to send")
    
    print("\n🎉 Auto-instrumentation demo completed!")
    print("\n💡 Key Benefits Demonstrated:")
    print("  ✅ Zero learning curve - existing code works unchanged")
    print("  ✅ Comprehensive coverage - all operations traced automatically")
    print("  ✅ Production ready - async support and error handling")
    print("  ✅ No performance impact - efficient background tracing")

if __name__ == "__main__":
    main()
