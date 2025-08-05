# FlowScope Python SDK Demo

This directory contains examples demonstrating the three integration paths for FlowScope Python SDK:

## 🔧 **Integration Path 1: Auto-Instrumentation**
Zero code changes - just import and everything works automatically.

```python
import flowscope.auto
flowscope.auto.init_auto()

# Your existing code works unchanged
from langchain.chains import LLMChain
# All LLMChain operations now traced automatically
```

## 📦 **Integration Path 2: Import Replacement**
Drop-in replacement imports with identical API.

```python
# Instead of: from langchain.chains import LLMChain
from flowscope.langchain import LLMChain

# API is identical, tracing is automatic
chain = LLMChain(llm=llm, prompt=prompt)
result = chain.run(input="Hello")
```

## 🎯 **Integration Path 3: Manual SDK**
Full control with decorators and context managers.

```python
import flowscope

@flowscope.trace("custom_operation")
def my_function():
    pass

# Or context manager
with flowscope.trace("database_query"):
    result = db.query("SELECT * FROM users")
```

## 📁 **Examples**

- `auto_instrumentation_example.py` - Zero-configuration automatic tracing
- `import_replacement_example.py` - Pre-wrapped component usage
- `manual_sdk_example.py` - Decorator and context manager usage
- `mixed_approach_example.py` - Combining multiple approaches

## 🏃 **Running Examples**

```bash
# Install FlowScope Python SDK
cd packages/python-sdk
pip install -e .

# Run examples
cd examples/python-sdk-demo
python auto_instrumentation_example.py
python import_replacement_example.py
python manual_sdk_example.py
```

## 🎯 **Key Benefits**

✅ **Zero Learning Curve**: Existing code works unchanged  
✅ **Gradual Adoption**: Mix approaches as needed  
✅ **Full Coverage**: All three paths provide complete tracing  
✅ **Production Ready**: Async support, error handling, performance optimized
