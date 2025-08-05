"""
FlowScope Context Management

Provides context propagation and nested operation tracking
for complex Python AI/ML workflows.
"""

import asyncio
import threading
from contextlib import contextmanager, asynccontextmanager
from typing import Any, Dict, Optional, Union
from contextvars import ContextVar

from .core import get_global_client, TraceData

# Context variables for async context propagation
_current_trace: ContextVar[Optional[TraceData]] = ContextVar('current_trace', default=None)
_current_context: ContextVar[Optional[Dict[str, Any]]] = ContextVar('current_context', default=None)

# Thread-local storage for sync context propagation
_thread_local = threading.local()

class FlowScopeContext:
    """Manages nested operation context and automatic trace propagation."""
    
    def __init__(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        self.name = name
        self.metadata = metadata or {}
        self.trace: Optional[TraceData] = None
        self.tags: Dict[str, Any] = {}
        self.result: Optional[Any] = None
        
    def set_tag(self, key: str, value: Any):
        """Set a tag on the current context."""
        self.tags[key] = value
        if self.trace:
            self.trace.set_tag(key, value)
        print(f"🏷️ Context tag set: {key} = {value}")
        
    def set_result(self, result: Any):
        """Set the result of the context operation."""
        self.result = result
        if self.trace:
            self.trace.set_output(result)
        print(f"📊 Context result set: {result}")
        
    def add_metadata(self, **kwargs):
        """Add metadata to the context."""
        self.metadata.update(kwargs)
        if self.trace:
            self.trace.metadata.update(kwargs)

def get_current_trace() -> Optional[TraceData]:
    """Get the current active trace."""
    # Try context var first (for async)
    trace = _current_trace.get(None)
    if trace is not None:
        return trace
        
    # Fall back to thread-local (for sync)
    return getattr(_thread_local, 'current_trace', None)

def set_current_trace(trace: Optional[TraceData]):
    """Set the current active trace."""
    _current_trace.set(trace)
    _thread_local.current_trace = trace

def current_context() -> Optional[FlowScopeContext]:
    """Get the current FlowScope context."""
    # Try context var first (for async)
    ctx = _current_context.get(None)
    if ctx is not None:
        return ctx
        
    # Fall back to thread-local (for sync)
    return getattr(_thread_local, 'current_context', None)

@contextmanager
def with_context(
    name: str,
    metadata: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None
):
    """
    Context manager for nested operation tracking.
    
    Usage:
        with with_context("database_operation") as ctx:
            ctx.set_tag("table", "users")
            result = db.query("SELECT * FROM users")
            ctx.set_result(result)
    """
    client = get_global_client()
    
    # Create context object
    context = FlowScopeContext(name, metadata)
    
    # Start trace
    context.trace = client.start_trace(
        f"context_{name}",
        session_id=session_id,
        metadata=metadata
    )
    
    # Set up context propagation
    previous_context = current_context()
    previous_trace = get_current_trace()
    
    _current_context.set(context)
    _thread_local.current_context = context
    
    if context.trace:
        set_current_trace(context.trace)
    
    print(f"🔄 Context started: {name}")
    
    try:
        yield context
        
        # Mark as successful
        if context.trace:
            client.finish_trace(context.trace, success=True)
            
    except Exception as e:
        # Mark as failed
        if context.trace:
            client.finish_trace(context.trace, success=False, error=str(e))
        raise
        
    finally:
        # Restore previous context
        _current_context.set(previous_context)
        _thread_local.current_context = previous_context
        set_current_trace(previous_trace)

@asynccontextmanager
async def async_with_context(
    name: str,
    metadata: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None
):
    """
    Async context manager for nested operation tracking.
    
    Usage:
        async with async_with_context("api_call") as ctx:
            ctx.set_tag("endpoint", "/api/v1/data")
            result = await api_client.get("/api/v1/data")
            ctx.set_result(result)
    """
    client = get_global_client()
    
    # Create context object
    context = FlowScopeContext(name, metadata)
    
    # Start trace
    context.trace = client.start_trace(
        f"context_{name}",
        session_id=session_id,
        metadata=metadata
    )
    
    # Set up context propagation
    previous_context = _current_context.get(None)
    previous_trace = _current_trace.get(None)
    
    _current_context.set(context)
    
    if context.trace:
        _current_trace.set(context.trace)
    
    print(f"🔄 Context started: {name}")
    
    try:
        yield context
        
        # Mark as successful
        if context.trace:
            client.finish_trace(context.trace, success=True)
            
    except Exception as e:
        # Mark as failed
        if context.trace:
            client.finish_trace(context.trace, success=False, error=str(e))
        raise
        
    finally:
        # Restore previous context
        _current_context.set(previous_context)
        _current_trace.set(previous_trace)

# Convenience functions
def add_context_tag(key: str, value: Any):
    """Add a tag to the current context."""
    ctx = current_context()
    if ctx:
        ctx.set_tag(key, value)

def set_context_result(result: Any):
    """Set the result of the current context."""
    ctx = current_context()
    if ctx:
        ctx.set_result(result)

def get_context_metadata() -> Dict[str, Any]:
    """Get metadata from the current context."""
    ctx = current_context()
    return ctx.metadata if ctx else {}

def is_in_context() -> bool:
    """Check if currently in a FlowScope context."""
    return current_context() is not None
