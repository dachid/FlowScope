"""
FlowScope LlamaIndex Import Replacement

Provides pre-wrapped LlamaIndex classes with automatic FlowScope tracing.
Usage: from flowscope.llamaindex import VectorStoreIndex  # Instead of from llama_index import VectorStoreIndex
"""

from typing import Any, Dict, Optional
import sys

from ..core import get_global_client

# Dynamic import of original LlamaIndex components
def _safe_import(module_path: str, class_name: str):
    """Safely import a class from LlamaIndex, return None if not available."""
    try:
        module = __import__(module_path, fromlist=[class_name])
        return getattr(module, class_name, None)
    except ImportError:
        return None

# Import original LlamaIndex classes
_OriginalVectorStoreIndex = _safe_import('llama_index.core', 'VectorStoreIndex') or _safe_import('llama_index', 'VectorStoreIndex')
_OriginalListIndex = _safe_import('llama_index.core', 'ListIndex') or _safe_import('llama_index', 'ListIndex')
_OriginalQueryEngine = _safe_import('llama_index.core.query_engine', 'BaseQueryEngine') or _safe_import('llama_index.query_engine', 'BaseQueryEngine')
_OriginalRetriever = _safe_import('llama_index.core.retrievers', 'BaseRetriever') or _safe_import('llama_index.retrievers', 'BaseRetriever')
_OriginalServiceContext = _safe_import('llama_index.core', 'ServiceContext') or _safe_import('llama_index', 'ServiceContext')

class TracedMixin:
    """Mixin class that adds FlowScope tracing to any LlamaIndex class."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._flowscope_client = get_global_client()
        self._flowscope_class_name = self.__class__.__name__
        
    def _trace_method(self, method_name: str, original_method, *args, **kwargs):
        """Helper method to trace any method call."""
        operation_name = f"llamaindex.{self._flowscope_class_name}.{method_name}"
        
        with self._flowscope_client.trace(
            operation_name,
            metadata={
                "framework": "llamaindex",
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
        operation_name = f"llamaindex.{self._flowscope_class_name}.{method_name}"
        
        with self._flowscope_client.trace(
            operation_name,
            metadata={
                "framework": "llamaindex",
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

# Wrapped LlamaIndex classes
if _OriginalVectorStoreIndex:
    class VectorStoreIndex(TracedMixin, _OriginalVectorStoreIndex):
        """FlowScope-instrumented VectorStoreIndex with automatic tracing."""
        
        def query(self, *args, **kwargs):
            return self._trace_method('query', super().query, *args, **kwargs)
            
        def as_query_engine(self, *args, **kwargs):
            result = self._trace_method('as_query_engine', super().as_query_engine, *args, **kwargs)
            # Wrap the returned query engine too
            if hasattr(result, 'query'):
                original_query = result.query
                def traced_query(*q_args, **q_kwargs):
                    return self._trace_method('query_engine.query', original_query, *q_args, **q_kwargs)
                result.query = traced_query
            return result
            
        def as_retriever(self, *args, **kwargs):
            result = self._trace_method('as_retriever', super().as_retriever, *args, **kwargs)
            # Wrap the returned retriever too
            if hasattr(result, 'retrieve'):
                original_retrieve = result.retrieve
                def traced_retrieve(*r_args, **r_kwargs):
                    return self._trace_method('retriever.retrieve', original_retrieve, *r_args, **r_kwargs)
                result.retrieve = traced_retrieve
            return result
            
        async def aquery(self, *args, **kwargs):
            return await self._trace_async_method('aquery', super().aquery, *args, **kwargs)
else:
    class VectorStoreIndex:
        """Mock VectorStoreIndex for environments without LlamaIndex."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LlamaIndex not available. Install with: pip install llama-index")

if _OriginalListIndex:
    class ListIndex(TracedMixin, _OriginalListIndex):
        """FlowScope-instrumented ListIndex with automatic tracing."""
        
        def query(self, *args, **kwargs):
            return self._trace_method('query', super().query, *args, **kwargs)
            
        def as_query_engine(self, *args, **kwargs):
            result = self._trace_method('as_query_engine', super().as_query_engine, *args, **kwargs)
            # Wrap the returned query engine
            if hasattr(result, 'query'):
                original_query = result.query
                def traced_query(*q_args, **q_kwargs):
                    return self._trace_method('query_engine.query', original_query, *q_args, **q_kwargs)
                result.query = traced_query
            return result
            
        async def aquery(self, *args, **kwargs):
            return await self._trace_async_method('aquery', super().aquery, *args, **kwargs)
else:
    class ListIndex:
        """Mock ListIndex for environments without LlamaIndex."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LlamaIndex not available. Install with: pip install llama-index")

if _OriginalQueryEngine:
    class BaseQueryEngine(TracedMixin, _OriginalQueryEngine):
        """FlowScope-instrumented BaseQueryEngine with automatic tracing."""
        
        def query(self, *args, **kwargs):
            return self._trace_method('query', super().query, *args, **kwargs)
            
        async def aquery(self, *args, **kwargs):
            return await self._trace_async_method('aquery', super().aquery, *args, **kwargs)
else:
    class BaseQueryEngine:
        """Mock BaseQueryEngine for environments without LlamaIndex."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LlamaIndex not available. Install with: pip install llama-index")

if _OriginalRetriever:
    class BaseRetriever(TracedMixin, _OriginalRetriever):
        """FlowScope-instrumented BaseRetriever with automatic tracing."""
        
        def retrieve(self, *args, **kwargs):
            return self._trace_method('retrieve', super().retrieve, *args, **kwargs)
            
        async def aretrieve(self, *args, **kwargs):
            return await self._trace_async_method('aretrieve', super().aretrieve, *args, **kwargs)
else:
    class BaseRetriever:
        """Mock BaseRetriever for environments without LlamaIndex."""
        def __init__(self, *args, **kwargs):
            raise ImportError("LlamaIndex not available. Install with: pip install llama-index")

# Additional convenience exports
QueryEngine = BaseQueryEngine
Retriever = BaseRetriever

# Export all wrapped classes
__all__ = [
    'VectorStoreIndex',
    'ListIndex',
    'BaseQueryEngine', 
    'QueryEngine',
    'BaseRetriever',
    'Retriever',
]

# Print import replacement info when module is loaded
print("🔧 FlowScope LlamaIndex import replacement loaded")
print("   Usage: from flowscope.llamaindex import VectorStoreIndex")
print("   All LlamaIndex operations will be automatically traced")
