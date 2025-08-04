# Sample LangChain Integration Code for FlowScope Testing
# This script demonstrates how FlowScope SDK integrates with LangChain
# Use this for testing the VS Code extension and SDK integration

from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
import os

# Note: Replace with your actual OpenAI API key for testing
os.environ["OPENAI_API_KEY"] = "your-openai-api-key-here"

def customer_support_chain():
    """
    Customer support chain that handles order inquiries
    FlowScope should automatically trace this execution
    """
    
    # Define the prompt template
    template = """
    You are a helpful customer support assistant for an e-commerce company.
    Always be empathetic and provide clear next steps.
    
    Customer inquiry: {customer_input}
    Order context: {order_context}
    
    Response:
    """
    
    prompt = PromptTemplate(
        input_variables=["customer_input", "order_context"],
        template=template
    )
    
    # Initialize the LLM
    llm = OpenAI(temperature=0.3, max_tokens=150)
    
    # Create the chain
    chain = LLMChain(llm=llm, prompt=prompt, verbose=True)
    
    # Test inputs
    test_cases = [
        {
            "customer_input": "I need help with my order #12345. It hasn't arrived yet and I placed it 2 weeks ago.",
            "order_context": "Order #12345: Status - Shipped, Carrier - UPS, Tracking - 1Z999AA1234567890"
        },
        {
            "customer_input": "I want to cancel my order #67890. I ordered the wrong size.",
            "order_context": "Order #67890: Status - Processing, Items - Blue T-Shirt Size M, Order Date - Today"
        },
        {
            "customer_input": "When will my refund be processed? I returned my item last week.",
            "order_context": "Return #R123: Status - Received, Refund Amount - $29.99, Processing Time - 3-5 business days"
        }
    ]
    
    print("🤖 Starting Customer Support Chain Tests...")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📞 Test Case {i}:")
        print(f"Customer: {test_case['customer_input']}")
        print("\n🔄 Processing...")
        
        try:
            response = chain.run(test_case)
            print(f"\n✅ Response: {response}")
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
        
        print("-" * 40)

def code_review_chain():
    """
    Code review chain for analyzing Python code
    Test with different code samples
    """
    
    template = """
    You are a senior software engineer conducting a code review.
    Provide constructive feedback focusing on:
    - Performance optimizations
    - Code readability
    - Best practices
    - Potential bugs
    
    Code to review:
    ```python
    {code}
    ```
    
    Review:
    """
    
    prompt = PromptTemplate(
        input_variables=["code"],
        template=template
    )
    
    llm = OpenAI(temperature=0.1, max_tokens=300)
    chain = LLMChain(llm=llm, prompt=prompt)
    
    # Test code samples
    test_codes = [
        """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
        """,
        """
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
        """,
        """
def find_max(numbers):
    max_num = numbers[0]
    for num in numbers:
        if num > max_num:
            max_num = num
    return max_num
        """
    ]
    
    print("\n👨‍💻 Starting Code Review Chain Tests...")
    print("=" * 50)
    
    for i, code in enumerate(test_codes, 1):
        print(f"\n📝 Code Review {i}:")
        print("🔄 Analyzing code...")
        
        try:
            review = chain.run(code=code.strip())
            print(f"\n✅ Review:\n{review}")
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
        
        print("-" * 40)

def conversation_memory_chain():
    """
    Conversational chain with memory to test stateful interactions
    """
    
    template = """
    You are a helpful AI assistant. Use the conversation history to provide contextual responses.
    
    {chat_history}
    Human: {human_input}
    AI: 
    """
    
    prompt = PromptTemplate(
        input_variables=["chat_history", "human_input"],
        template=template
    )
    
    llm = OpenAI(temperature=0.7, max_tokens=100)
    memory = ConversationBufferMemory(memory_key="chat_history", input_key="human_input")
    
    chain = LLMChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True
    )
    
    # Simulate a conversation
    conversation_turns = [
        "Hi, my name is Alice and I'm working on a Python project.",
        "Can you help me understand list comprehensions?",
        "What's the difference between a list comprehension and a for loop?",
        "Thanks! Can you show me an example using my name in the code?",
        "That's perfect! What other Python features should I learn next?"
    ]
    
    print("\n💬 Starting Conversation Memory Chain Test...")
    print("=" * 50)
    
    for i, user_input in enumerate(conversation_turns, 1):
        print(f"\n🗨️ Turn {i}:")
        print(f"Human: {user_input}")
        print("🔄 Thinking...")
        
        try:
            response = chain.predict(human_input=user_input)
            print(f"AI: {response}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("-" * 30)

if __name__ == "__main__":
    print("🚀 FlowScope LangChain Integration Test")
    print("This script will generate traces that should appear in FlowScope")
    print("\n⚠️  Make sure to:")
    print("1. Set your OpenAI API key")
    print("2. Have FlowScope backend running")
    print("3. Install FlowScope SDK if testing manual integration")
    print("\n" + "=" * 60)
    
    try:
        # Run all test chains
        customer_support_chain()
        code_review_chain()
        conversation_memory_chain()
        
        print("\n🎉 All tests completed!")
        print("Check FlowScope dashboard for captured traces.")
        
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        print("Make sure all dependencies are installed and API keys are set.")
