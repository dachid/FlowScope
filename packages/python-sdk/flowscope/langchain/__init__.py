"""
FlowScope LangChain Import Replacement

Provides pre-wrapped LangChain classes with automatic FlowScope tracing.
Usage: from flowscope.langchain import LLMChain  # Instead of from langchain import LLMChain
"""

from typing import Any, Dict, Optional
import sys

from ..core import get_global_client

# Dynamic import of original LangChain components
def _safe_import(module_path: str, class_name: str):
    """Safely import a class from LangChain, return None if not available."""
    try:
        module = __import__(module_path, fromlist=[class_name])
        return getattr(module, class_name, None)
    except ImportError:
        return None

# Import original LangChain classes
_OriginalLLMChain = _safe_import('langchain.chains', 'LLMChain')
_OriginalConversationChain = _safe_import('langchain.chains', 'ConversationChain')
_OriginalRetrievalQA = _safe_import('langchain.chains', 'RetrievalQA')
_OriginalAgentExecutor = _safe_import('langchain.agents', 'AgentExecutor')
_OriginalVectorStoreRetriever = _safe_import('langchain.vectorstores.base', 'VectorStoreRetriever')

class TracedMixin:
    """Mixin class that adds FlowScope tracing to any class."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._flowscope_client = get_global_client()
        self._flowscope_class_name = self.__class__.__name__
        
    def _trace_method(self, method_name: str, original_method, *args, **kwargs):
        """Helper method to trace any method call."""
        operation_name = f"langchain.{self._flowscope_class_name}.{method_name}"
        
        with self._flowscope_client.trace(
            operation_name,
            metadata={
                "framework": "langchain",
                "class": self._flowscope_class_name,
                "method": method_name,
                "import_replacement": True
            }
        ) as trace:
            if trace:
                trace.set_input({"args": args, "kwargs": kwargs})
                
            result = original_method(*args, **kwargs)
            
            if trace:
                trace.set_output(result)
                
            return result
            
    async def _trace_async_method(self, method_name: str, original_method, *args, **kwargs):
        """Helper method to trace async method calls."""
        operation_name = f"langchain.{self._flowscope_class_name}.{method_name}"
        
        with self._flowscope_client.trace(
            operation_name,
            metadata={
                "framework": "langchain",
                "class": self._flowscope_class_name,
                "method": method_name,
                "import_replacement": True
            }
        ) as trace:
            if trace:
                trace.set_input({"args": args, "kwargs": kwargs})
                
            result = await original_method(*args, **kwargs)
            
            if trace:
                trace.set_output(result)
                
            return result

# Wrapped LangChain classes
if _OriginalLLMChain:
    class LLMChain(TracedMixin, _OriginalLLMChain):
        """FlowScope-instrumented LLMChain with automatic tracing."""
        
        def run(self, *args, **kwargs):
            return self._trace_method('run', super().run, *args, **kwargs)
            
        def call(self, *args, **kwargs):
            return self._trace_method('call', super().call, *args, **kwargs)
            
        def invoke(self, *args, **kwargs):
            return self._trace_method('invoke', super().invoke, *args, **kwargs)
            
        async def arun(self, *args, **kwargs):
            return await self._trace_async_method('arun', super().arun, *args, **kwargs)
            
        async def acall(self, *args, **kwargs):
            return await self._trace_async_method('acall', super().acall, *args, **kwargs)
            
        async def ainvoke(self, *args, **kwargs):
            return await self._trace_async_method('ainvoke', super().ainvoke, *args, **kwargs)
else:
    class LLMChain:
        """Mock LLMChain for environments without LangChain."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LangChain not available. Install with: pip install langchain")

if _OriginalConversationChain:
    class ConversationChain(TracedMixin, _OriginalConversationChain):
        """FlowScope-instrumented ConversationChain with automatic tracing."""
        
        def run(self, *args, **kwargs):
            return self._trace_method('run', super().run, *args, **kwargs)
            
        def predict(self, *args, **kwargs):
            return self._trace_method('predict', super().predict, *args, **kwargs)
            
        def call(self, *args, **kwargs):
            return self._trace_method('call', super().call, *args, **kwargs)
            
        def invoke(self, *args, **kwargs):
            return self._trace_method('invoke', super().invoke, *args, **kwargs)
            
        async def arun(self, *args, **kwargs):
            return await self._trace_async_method('arun', super().arun, *args, **kwargs)
            
        async def apredict(self, *args, **kwargs):
            return await self._trace_async_method('apredict', super().apredict, *args, **kwargs)
            
        async def acall(self, *args, **kwargs):
            return await self._trace_async_method('acall', super().acall, *args, **kwargs)
            
        async def ainvoke(self, *args, **kwargs):
            return await self._trace_async_method('ainvoke', super().ainvoke, *args, **kwargs)
else:
    class ConversationChain:
        """Mock ConversationChain for environments without LangChain."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LangChain not available. Install with: pip install langchain")

if _OriginalRetrievalQA:
    class RetrievalQA(TracedMixin, _OriginalRetrievalQA):
        """FlowScope-instrumented RetrievalQA with automatic tracing."""
        
        def run(self, *args, **kwargs):
            return self._trace_method('run', super().run, *args, **kwargs)
            
        def call(self, *args, **kwargs):
            return self._trace_method('call', super().call, *args, **kwargs)
            
        def invoke(self, *args, **kwargs):
            return self._trace_method('invoke', super().invoke, *args, **kwargs)
            
        async def arun(self, *args, **kwargs):
            return await self._trace_async_method('arun', super().arun, *args, **kwargs)
            
        async def acall(self, *args, **kwargs):
            return await self._trace_async_method('acall', super().acall, *args, **kwargs)
            
        async def ainvoke(self, *args, **kwargs):
            return await self._trace_async_method('ainvoke', super().ainvoke, *args, **kwargs)
else:
    class RetrievalQA:
        """Mock RetrievalQA for environments without LangChain."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LangChain not available. Install with: pip install langchain")

if _OriginalAgentExecutor:
    class AgentExecutor(TracedMixin, _OriginalAgentExecutor):
        """FlowScope-instrumented AgentExecutor with automatic tracing."""
        
        def run(self, *args, **kwargs):
            return self._trace_method('run', super().run, *args, **kwargs)
            
        def call(self, *args, **kwargs):
            return self._trace_method('call', super().call, *args, **kwargs)
            
        def invoke(self, *args, **kwargs):
            return self._trace_method('invoke', super().invoke, *args, **kwargs)
            
        async def arun(self, *args, **kwargs):
            return await self._trace_async_method('arun', super().arun, *args, **kwargs)
            
        async def acall(self, *args, **kwargs):
            return await self._trace_async_method('acall', super().acall, *args, **kwargs)
            
        async def ainvoke(self, *args, **kwargs):
            return await self._trace_async_method('ainvoke', super().ainvoke, *args, **kwargs)
else:
    class AgentExecutor:
        """Mock AgentExecutor for environments without LangChain."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LangChain not available. Install with: pip install langchain")

# Export all wrapped classes
__all__ = [
    'LLMChain',
    'ConversationChain', 
    'RetrievalQA',
    'AgentExecutor',
]

# Print import replacement info when module is loaded
print("🔧 FlowScope LangChain import replacement loaded")
print("   Usage: from flowscope.langchain import LLMChain")
print("   All LangChain operations will be automatically traced")
