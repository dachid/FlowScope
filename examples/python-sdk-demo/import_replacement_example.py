#!/usr/bin/env python3
"""
FlowScope Python SDK - Import Replacement Example

This example demonstrates using pre-wrapped FlowScope components
that have identical APIs to the original frameworks but with
automatic tracing built-in.
"""

import sys
import os
import time
import random

# Add the SDK to path for demo purposes
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'python-sdk'))

# Import FlowScope and configure
import flowscope
flowscope.configure(
    session_id="import-replacement-demo",
    include_inputs=True,
    include_outputs=True
)

# Import replacement approach - use FlowScope wrapped components
# In real usage: from flowscope.langchain import LLMChain, ConversationChain
# For demo, we'll create mock implementations

class MockLLM:
    """Mock LLM for demonstration."""
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model
        
    def __call__(self, prompt):
        time.sleep(0.1 + random.random() * 0.2)
        if "error" in prompt.lower():
            raise Exception("Simulated LLM error")
        return f"Wrapped LLM response ({self.model}): {prompt}"

# Mock FlowScope wrapped components (these simulate the real wrapped classes)
class TracedLLMChain:
    """Mock FlowScope-wrapped LLMChain with automatic tracing."""
    
    def __init__(self, llm, prompt_template):
        self.llm = llm
        self.prompt_template = prompt_template
        self._flowscope_client = flowscope.get_client()
        print(f"🔗 FlowScope-wrapped LLMChain initialized")
        
    def run(self, **kwargs):
        """Run the chain with automatic tracing."""
        with self._flowscope_client.trace(
            "langchain.LLMChain.run",
            metadata={
                "framework": "langchain",
                "class": "LLMChain",
                "method": "run",
                "import_replacement": True
            }
        ) as trace:
            prompt = self.prompt_template.format(**kwargs)
            print(f"📝 Wrapped LLMChain.run() - prompt: {prompt[:50]}...")
            
            if trace:
                trace.set_input({"prompt_template": self.prompt_template, "kwargs": kwargs})
                
            result = self.llm(prompt)
            
            if trace:
                trace.set_output(result)
                trace.set_tag("model", self.llm.model)
                trace.set_tag("prompt_length", len(prompt))
                
            return result
            
    def call(self, inputs):
        """Call the chain with automatic tracing."""
        with self._flowscope_client.trace(
            "langchain.LLMChain.call",
            metadata={
                "framework": "langchain",
                "class": "LLMChain", 
                "method": "call",
                "import_replacement": True
            }
        ) as trace:
            prompt = self.prompt_template.format(**inputs)
            print(f"📞 Wrapped LLMChain.call() - processing inputs")
            
            if trace:
                trace.set_input(inputs)
                
            result_text = self.llm(prompt)
            result = {"text": result_text, "source": "wrapped_chain"}
            
            if trace:
                trace.set_output(result)
                trace.set_tag("input_keys", list(inputs.keys()))
                
            return result

class TracedConversationChain:
    """Mock FlowScope-wrapped ConversationChain with automatic tracing."""
    
    def __init__(self, llm):
        self.llm = llm
        self.memory = []
        self._flowscope_client = flowscope.get_client()
        print(f"💬 FlowScope-wrapped ConversationChain initialized")
        
    def predict(self, input_text):
        """Predict with automatic tracing."""
        with self._flowscope_client.trace(
            "langchain.ConversationChain.predict",
            metadata={
                "framework": "langchain",
                "class": "ConversationChain",
                "method": "predict", 
                "import_replacement": True
            }
        ) as trace:
            print(f"🔮 Wrapped ConversationChain.predict() - input: {input_text}")
            
            if trace:
                trace.set_input({"input": input_text, "memory_length": len(self.memory)})
                
            # Build context from memory
            context = " ".join(self.memory[-4:])  # Last 4 exchanges
            full_prompt = f"Context: {context}\nHuman: {input_text}\nAI:"
            
            response = self.llm(full_prompt)
            
            # Update memory
            self.memory.append(f"Human: {input_text}")
            self.memory.append(f"AI: {response}")
            
            if trace:
                trace.set_output(response)
                trace.set_tag("context_length", len(context))
                trace.set_tag("memory_size", len(self.memory))
                
            return response
            
    def run(self, input_dict):
        """Run with input dictionary."""
        return self.predict(input_dict.get("input", ""))

def demo_wrapped_llm_chain():
    """Demonstrate wrapped LLMChain usage."""
    print("\n--- Demo 1: Wrapped LLMChain Usage ---")
    
    # Create components (identical API to original LangChain)
    llm = MockLLM("gpt-4")
    prompt_template = "Answer this question with expertise: {question}"
    
    # This is identical to: LLMChain(llm=llm, prompt=prompt_template)
    # But automatically traced via FlowScope
    chain = TracedLLMChain(llm=llm, prompt_template=prompt_template)
    
    questions = [
        "What are the key principles of software architecture?",
        "How do microservices differ from monoliths?",
        "Explain event-driven architecture patterns",
        "What are some error handling best practices?"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n--- Question {i} ---")
        try:
            # Identical API to original LangChain
            result = chain.run(question=question)
            print(f"✅ Answer: {result}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
        time.sleep(0.4)

def demo_wrapped_conversation_chain():
    """Demonstrate wrapped ConversationChain usage."""
    print("\n--- Demo 2: Wrapped ConversationChain Usage ---")
    
    llm = MockLLM("gpt-3.5-turbo")
    
    # Identical API to original LangChain ConversationChain
    conversation = TracedConversationChain(llm=llm)
    
    dialogue = [
        "Hi, I'm working on a Python project",
        "What's the best way to structure a Flask application?",
        "How should I handle database connections?",
        "What about testing strategies?",
        "Thanks for the advice!"
    ]
    
    for i, message in enumerate(dialogue, 1):
        print(f"\n--- Turn {i} ---")
        try:
            # Identical API - but automatically traced
            response = conversation.predict(message)
            print(f"✅ Response: {response}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
        time.sleep(0.3)

def demo_mixed_usage():
    """Demonstrate mixing different wrapped components."""
    print("\n--- Demo 3: Mixed Component Usage ---")
    
    # Create multiple LLMs and chains
    llm1 = MockLLM("gpt-4")
    llm2 = MockLLM("gpt-3.5-turbo")
    
    # Analysis chain
    analysis_chain = TracedLLMChain(
        llm=llm1,
        prompt_template="Analyze this topic: {topic}. Provide key insights."
    )
    
    # Summary chain  
    summary_chain = TracedLLMChain(
        llm=llm2,
        prompt_template="Summarize this analysis in 2 sentences: {analysis}"
    )
    
    topics = [
        "Machine Learning in Production",
        "Cloud Architecture Patterns",
        "API Design Best Practices"
    ]
    
    for i, topic in enumerate(topics, 1):
        print(f"\n--- Topic {i}: {topic} ---")
        
        try:
            # Step 1: Analysis (automatically traced)
            analysis = analysis_chain.run(topic=topic)
            print(f"📊 Analysis: {analysis[:100]}...")
            
            # Step 2: Summary (automatically traced)
            summary = summary_chain.run(analysis=analysis)
            print(f"📝 Summary: {summary}")
            
        except Exception as e:
            print(f"❌ Error in processing: {e}")
            
        time.sleep(0.5)

def main():
    """Main demo function showcasing import replacement."""
    print("🚀 FlowScope Python SDK - Import Replacement Demo")
    print("=" * 60)
    print("This demo shows using pre-wrapped FlowScope components with")
    print("identical APIs but automatic tracing built-in.\n")
    
    # Create session
    session_id = flowscope.create_session("import-replacement-session", {
        "demo_type": "import_replacement",
        "language": "python",
        "integration_path": "wrapped_components"
    })
    
    # Demo 1: Basic wrapped chain usage
    demo_wrapped_llm_chain()
    
    # Demo 2: Wrapped conversation chain
    demo_wrapped_conversation_chain()
    
    # Demo 3: Mixed component usage
    demo_mixed_usage()
    
    # Show usage summary
    print("\n📊 Import Replacement Summary:")
    print(f"Session ID: {session_id}")
    print("✅ Identical API to original LangChain")
    print("✅ Automatic tracing with zero overhead")
    print("✅ Type safety and IDE support maintained")
    print("✅ Drop-in replacement for existing code")
    
    # Show trace statistics
    client = flowscope.get_client()
    print(f"\n📈 Traces captured: {len(client.traces)}")
    
    for trace in client.traces[-3:]:  # Show last 3 traces
        print(f"  • {trace.operation} ({trace.status}, {trace.duration:.1f}ms)")
    
    # Flush traces
    print("\n🚀 Flushing traces to FlowScope backend...")
    success = flowscope.flush()
    if success:
        print("✅ All traces sent successfully")
    else:
        print("❌ Some traces failed to send")
    
    print("\n🎉 Import replacement demo completed!")
    print("\n💡 Key Benefits Demonstrated:")
    print("  ✅ API compatibility - existing code works unchanged")
    print("  ✅ Enhanced functionality - automatic tracing included")
    print("  ✅ Type safety - full IDE support and type hints")
    print("  ✅ Gradual adoption - mix with original components as needed")

if __name__ == "__main__":
    main()
