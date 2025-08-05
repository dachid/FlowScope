"""
FlowScope Auto-Instrumentation for Python

Provides automatic instrumentation for LangChain, LlamaIndex,
and other AI/ML frameworks using import hooks and monkey patching.
"""

import sys
import importlib.util
import importlib.abc
import types
from typing import Any, Dict, List, Optional, Set, Callable
from functools import wraps

from .core import get_global_client

# Global state for auto-instrumentation
_auto_instrumentation_enabled = False
_instrumented_modules: Set[str] = set()
_original_imports: Dict[str, Any] = {}
_config = {
    "frameworks": ["langchain", "llamaindex"],
    "patch_on_import": True,
    "trace_async": True,
    "include_args": True,
    "include_results": True,
    "ignore_methods": ["__init__", "__repr__", "__str__"],
}

class FlowScopeImportHook(importlib.abc.MetaPathFinder, importlib.abc.Loader):
    """Custom import hook for automatic instrumentation."""
    
    def __init__(self, target_modules: List[str]):
        self.target_modules = target_modules
        
    def find_spec(self, fullname, path, target=None):
        """Find module spec and determine if we should instrument it."""
        if not _auto_instrumentation_enabled:
            return None
            
        # Check if this is a module we want to instrument
        for target in self.target_modules:
            if fullname.startswith(target):
                # Let the default finder handle the actual loading
                spec = None
                for finder in sys.meta_path:
                    if isinstance(finder, FlowScopeImportHook):
                        continue
                    if hasattr(finder, 'find_spec'):
                        spec = finder.find_spec(fullname, path, target)
                        if spec is not None:
                            break
                
                if spec is not None:
                    # Wrap the loader to add instrumentation
                    original_loader = spec.loader
                    spec.loader = FlowScopeLoader(original_loader, fullname)
                    
                return spec
                
        return None

class FlowScopeLoader(importlib.abc.Loader):
    """Custom loader that instruments modules after loading."""
    
    def __init__(self, original_loader, module_name):
        self.original_loader = original_loader
        self.module_name = module_name
        
    def create_module(self, spec):
        """Create the module using the original loader."""
        if hasattr(self.original_loader, 'create_module'):
            return self.original_loader.create_module(spec)
        return None
        
    def exec_module(self, module):
        """Execute the module and then instrument it."""
        # Execute the original module
        if hasattr(self.original_loader, 'exec_module'):
            self.original_loader.exec_module(module)
        
        # Instrument the module if it matches our targets
        if self.module_name not in _instrumented_modules:
            _instrument_module(module, self.module_name)
            _instrumented_modules.add(self.module_name)

def _instrument_module(module: types.ModuleType, module_name: str):
    """Instrument a module by patching key classes and methods."""
    print(f"[FlowScope] Auto-instrumenting: {module_name}")
    
    # LangChain instrumentation
    if "langchain" in module_name:
        _instrument_langchain_module(module, module_name)
    
    # LlamaIndex instrumentation
    elif "llama_index" in module_name or "llamaindex" in module_name:
        _instrument_llamaindex_module(module, module_name)

def _instrument_langchain_module(module: types.ModuleType, module_name: str):
    """Instrument LangChain-specific classes and methods."""
    
    # Common LangChain classes to instrument
    targets = [
        "LLMChain", "ConversationChain", "RetrievalQA", "VectorStoreRetriever",
        "AgentExecutor", "Agent", "BaseLanguageModel", "BaseLLM", "BaseChain"
    ]
    
    for attr_name in dir(module):
        attr = getattr(module, attr_name)
        
        # Check if this is a class we want to instrument
        if isinstance(attr, type) and attr_name in targets:
            _instrument_class(attr, f"langchain.{attr_name}")

def _instrument_llamaindex_module(module: types.ModuleType, module_name: str):
    """Instrument LlamaIndex-specific classes and methods."""
    
    # Common LlamaIndex classes to instrument  
    targets = [
        "VectorStoreIndex", "ListIndex", "QueryEngine", "RetrieverQueryEngine",
        "BaseQueryEngine", "BaseRetriever", "LLMPredictor", "ServiceContext"
    ]
    
    for attr_name in dir(module):
        attr = getattr(module, attr_name)
        
        # Check if this is a class we want to instrument
        if isinstance(attr, type) and attr_name in targets:
            _instrument_class(attr, f"llamaindex.{attr_name}")

def _instrument_class(cls: type, class_name: str):
    """Instrument all relevant methods of a class."""
    
    # Methods to instrument for different classes
    method_mappings = {
        "langchain.LLMChain": ["run", "call", "invoke", "arun", "acall", "ainvoke"],
        "langchain.ConversationChain": ["run", "predict", "call", "invoke"],
        "langchain.RetrievalQA": ["run", "call", "invoke"],
        "langchain.AgentExecutor": ["run", "call", "invoke"],
        "llamaindex.VectorStoreIndex": ["query", "as_query_engine", "as_retriever"],
        "llamaindex.QueryEngine": ["query", "aquery"],
        "llamaindex.BaseRetriever": ["retrieve", "aretrieve"],
    }
    
    # Get methods to instrument for this class
    methods_to_patch = method_mappings.get(class_name, ["run", "call", "invoke", "query"])
    
    for method_name in methods_to_patch:
        if hasattr(cls, method_name) and method_name not in _config["ignore_methods"]:
            _instrument_method(cls, method_name, class_name)

def _instrument_method(cls: type, method_name: str, class_name: str):
    """Instrument a specific method of a class."""
    
    original_method = getattr(cls, method_name)
    
    # Skip if already instrumented
    if hasattr(original_method, '_flowscope_instrumented'):
        return
    
    @wraps(original_method)
    def sync_wrapper(self, *args, **kwargs):
        client = get_global_client()
        operation_name = f"{class_name}.{method_name}"
        
        with client.trace(
            operation_name,
            metadata={
                "framework": "langchain" if "langchain" in class_name else "llamaindex",
                "class": class_name,
                "method": method_name,
                "auto_instrumented": True
            }
        ) as trace:
            if trace and _config["include_args"]:
                trace.set_input({"args": args, "kwargs": kwargs})
                
            result = original_method(self, *args, **kwargs)
            
            if trace and _config["include_results"]:
                trace.set_output(result)
                
            return result
    
    @wraps(original_method)
    async def async_wrapper(self, *args, **kwargs):
        client = get_global_client()
        operation_name = f"{class_name}.{method_name}"
        
        with client.trace(
            operation_name,
            metadata={
                "framework": "langchain" if "langchain" in class_name else "llamaindex", 
                "class": class_name,
                "method": method_name,
                "auto_instrumented": True
            }
        ) as trace:
            if trace and _config["include_args"]:
                trace.set_input({"args": args, "kwargs": kwargs})
                
            result = await original_method(self, *args, **kwargs)
            
            if trace and _config["include_results"]:
                trace.set_output(result)
                
            return result
    
    # Determine if we need sync or async wrapper
    import asyncio
    if asyncio.iscoroutinefunction(original_method):
        wrapper = async_wrapper
    else:
        wrapper = sync_wrapper
    
    # Mark as instrumented and replace
    wrapper._flowscope_instrumented = True
    setattr(cls, method_name, wrapper)
    
    print(f"[FlowScope] Instrumented: {class_name}.{method_name}")

def auto_instrument(frameworks: Optional[List[str]] = None) -> bool:
    """
    Enable automatic instrumentation for specified frameworks.
    
    Args:
        frameworks: List of frameworks to instrument ["langchain", "llamaindex"]
    
    Returns:
        True if instrumentation was enabled successfully
    """
    global _auto_instrumentation_enabled
    
    if frameworks is None:
        frameworks = _config["frameworks"]
        
    try:
        # Install import hook
        hook = FlowScopeImportHook(frameworks)
        
        # Insert at the beginning to catch imports early
        if hook not in sys.meta_path:
            sys.meta_path.insert(0, hook)
        
        _auto_instrumentation_enabled = True
        
        print(f"[FlowScope] Auto-instrumentation enabled for: {', '.join(frameworks)}")
        
        # Try to instrument already imported modules
        _instrument_existing_modules(frameworks)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to enable auto-instrumentation: {e}")
        return False

def _instrument_existing_modules(frameworks: List[str]):
    """Instrument modules that were imported before auto-instrumentation was enabled."""
    
    for module_name, module in sys.modules.items():
        if module is None:
            continue
            
        # Check if this module should be instrumented
        should_instrument = False
        for framework in frameworks:
            if module_name.startswith(framework):
                should_instrument = True
                break
                
        if should_instrument and module_name not in _instrumented_modules:
            _instrument_module(module, module_name)
            _instrumented_modules.add(module_name)

def configure_auto_instrumentation(**kwargs):
    """Configure auto-instrumentation behavior."""
    global _config
    _config.update(kwargs)
    print(f"[FlowScope] Auto-instrumentation configured: {_config}")

def disable_auto_instrumentation():
    """Disable automatic instrumentation."""
    global _auto_instrumentation_enabled
    _auto_instrumentation_enabled = False
    
    # Remove our import hook
    sys.meta_path = [hook for hook in sys.meta_path if not isinstance(hook, FlowScopeImportHook)]
    
    print("[FlowScope] Auto-instrumentation disabled")

def is_auto_instrumentation_enabled() -> bool:
    """Check if auto-instrumentation is currently enabled."""
    return _auto_instrumentation_enabled

def get_instrumented_modules() -> Set[str]:
    """Get the set of modules that have been instrumented."""
    return _instrumented_modules.copy()

# Convenience function for quick setup
def init_auto(frameworks: Optional[List[str]] = None, **config):
    """
    Initialize FlowScope with auto-instrumentation enabled.
    
    Usage:
        import flowscope.auto
        flowscope.auto.init_auto()
        
        # Or with configuration:
        flowscope.auto.init_auto(
            frameworks=["langchain"],
            include_args=False,
            trace_async=True
        )
    """
    if config:
        configure_auto_instrumentation(**config)
        
    return auto_instrument(frameworks)
