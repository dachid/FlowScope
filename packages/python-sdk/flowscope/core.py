"""
FlowScope Core Client Implementation

Provides the main client for trace capture, session management,
and communication with the FlowScope backend.
"""

import asyncio
import json
import time
import uuid
import threading
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, Callable
from functools import wraps

try:
    import httpx
    import websockets
except ImportError:
    httpx = None
    websockets = None


class TraceData:
    """Represents a single trace/span in FlowScope."""
    
    def __init__(
        self,
        operation: str,
        session_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = str(uuid.uuid4())
        self.operation = operation
        self.session_id = session_id
        self.parent_id = parent_id
        self.metadata = metadata or {}
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.duration: Optional[float] = None
        self.status = "pending"
        self.input_data: Optional[Any] = None
        self.output_data: Optional[Any] = None
        self.error: Optional[str] = None
        self.tags: Dict[str, Any] = {}
        
    def finish(self, success: bool = True, error: Optional[str] = None):
        """Mark the trace as completed."""
        self.end_time = time.time()
        self.duration = (self.end_time - self.start_time) * 1000  # Convert to milliseconds
        self.status = "success" if success else "error"
        if error:
            self.error = error
            
    def set_input(self, data: Any):
        """Set input data for the trace."""
        self.input_data = data
        
    def set_output(self, data: Any):
        """Set output data for the trace."""
        self.output_data = data
        
    def set_tag(self, key: str, value: Any):
        """Set a tag on the trace."""
        self.tags[key] = value
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert trace to dictionary format."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "parent_id": self.parent_id,
            "operation": self.operation,
            "framework": self.metadata.get("framework", "custom"),
            "language": "python",
            "start_time": datetime.fromtimestamp(self.start_time).isoformat() + "Z",
            "end_time": datetime.fromtimestamp(self.end_time).isoformat() + "Z" if self.end_time else None,
            "duration": self.duration,
            "input": self.input_data,
            "output": self.output_data,
            "metadata": self.metadata,
            "status": self.status,
            "error": self.error,
            "tags": self.tags,
        }


class FlowScopeClient:
    """Main FlowScope client for Python applications."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = {
            "backend_url": "http://localhost:3001",
            "websocket_url": "ws://localhost:3001",
            "session_id": None,
            "auto_flush": True,
            "batch_size": 100,
            "flush_interval": 5.0,
            "include_inputs": True,
            "include_outputs": True,
            "include_stack_trace": False,
            "disabled": False,
        }
        if config:
            self.config.update(config)
            
        self.traces: List[TraceData] = []
        self.active_traces: Dict[str, TraceData] = {}
        self.trace_stack: List[str] = []  # Stack of active trace IDs
        self._lock = threading.Lock()
        self._flush_timer: Optional[threading.Timer] = None
        
        # Session management
        self.current_session_id: Optional[str] = self.config.get("session_id")
        
    def configure(self, config: Optional[Dict[str, Any]] = None, **kwargs):
        """Update client configuration."""
        if config:
            self.config.update(config)
        self.config.update(kwargs)
        return self
        
    def create_session(self, session_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Create a new debugging session."""
        if session_id is None:
            session_id = f"session_{uuid.uuid4().hex[:8]}"
            
        self.current_session_id = session_id
        print(f"🎯 FlowScope session created: {session_id}")
        
        # In a real implementation, this would register the session with the backend
        return session_id
        
    def set_session(self, session_id: str):
        """Set the active session."""
        self.current_session_id = session_id
        
    def get_current_parent_id(self) -> Optional[str]:
        """Get the ID of the current parent trace."""
        return self.trace_stack[-1] if self.trace_stack else None
        
    def start_trace(
        self,
        operation: str,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TraceData:
        """Start a new trace."""
        if self.config["disabled"]:
            return None
            
        session_id = session_id or self.current_session_id
        parent_id = self.get_current_parent_id()
        
        trace = TraceData(
            operation=operation,
            session_id=session_id,
            parent_id=parent_id,
            metadata=metadata
        )
        
        with self._lock:
            self.active_traces[trace.id] = trace
            self.trace_stack.append(trace.id)
            
        return trace
        
    def finish_trace(self, trace: TraceData, success: bool = True, error: Optional[str] = None):
        """Finish a trace and add it to the batch."""
        if trace is None or self.config["disabled"]:
            return
            
        trace.finish(success, error)
        
        with self._lock:
            # Remove from active traces
            self.active_traces.pop(trace.id, None)
            if trace.id in self.trace_stack:
                self.trace_stack.remove(trace.id)
                
            # Add to completed traces
            self.traces.append(trace)
            
        print(f"{'✅' if success else '❌'} FlowScope trace: {trace.operation} "
              f"({'success' if success else 'error'}, {trace.duration:.2f}ms)")
              
        # Auto-flush if batch is full
        if self.config["auto_flush"] and len(self.traces) >= self.config["batch_size"]:
            self._flush_async()
            
    def _flush_async(self):
        """Flush traces asynchronously."""
        if self._flush_timer:
            self._flush_timer.cancel()
            
        def flush_worker():
            try:
                self.flush()
            except Exception as e:
                print(f"❌ FlowScope flush error: {e}")
                
        self._flush_timer = threading.Timer(0.1, flush_worker)
        self._flush_timer.start()
        
    def flush(self) -> bool:
        """Flush all pending traces to the backend."""
        if self.config["disabled"]:
            return True
            
        with self._lock:
            traces_to_send = self.traces.copy()
            self.traces.clear()
            
        if not traces_to_send:
            return True
            
        try:
            # Convert traces to backend format
            trace_data = [trace.to_dict() for trace in traces_to_send]
            
            print(f"🚀 Flushing {len(trace_data)} Python traces...")
            
            # In a real implementation, this would send to the backend
            # For now, just simulate the flush
            time.sleep(0.1)  # Simulate network delay
            
            print(f"✅ Python traces flushed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to flush traces: {e}")
            # Put traces back in the queue on failure
            with self._lock:
                self.traces.extend(traces_to_send)
            return False
            
    @contextmanager
    def trace(
        self,
        operation: str,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        include_args: bool = None,
        include_result: bool = None
    ):
        """Context manager for manual tracing."""
        if include_args is None:
            include_args = self.config["include_inputs"]
        if include_result is None:
            include_result = self.config["include_outputs"]
            
        trace = self.start_trace(operation, session_id, metadata)
        
        if trace is None:
            yield None
            return
            
        try:
            yield trace
            self.finish_trace(trace, success=True)
        except Exception as e:
            self.finish_trace(trace, success=False, error=str(e))
            raise
            
    def trace_decorator(
        self,
        operation: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        include_args: bool = None,
        include_result: bool = None
    ):
        """Decorator for automatic method tracing."""
        def decorator(func):
            op_name = operation or f"{func.__module__}.{func.__name__}"
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                with self.trace(
                    op_name, session_id, metadata, include_args, include_result
                ) as trace:
                    if trace and include_args:
                        trace.set_input({"args": args, "kwargs": kwargs})
                        
                    result = func(*args, **kwargs)
                    
                    if trace and include_result:
                        trace.set_output(result)
                        
                    return result
                    
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                with self.trace(
                    op_name, session_id, metadata, include_args, include_result
                ) as trace:
                    if trace and include_args:
                        trace.set_input({"args": args, "kwargs": kwargs})
                        
                    result = await func(*args, **kwargs)
                    
                    if trace and include_result:
                        trace.set_output(result)
                        
                    return result
                    
            # Return appropriate wrapper based on function type
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
                
        return decorator


# Global client instance
_global_client = None

def get_global_client() -> FlowScopeClient:
    """Get or create the global FlowScope client."""
    global _global_client
    if _global_client is None:
        _global_client = FlowScopeClient()
    return _global_client

def init(config: Optional[Dict[str, Any]] = None, **kwargs) -> FlowScopeClient:
    """Initialize FlowScope with configuration."""
    global _global_client
    _global_client = FlowScopeClient(config)
    if kwargs:
        _global_client.configure(**kwargs)
    return _global_client

def trace(
    operation: str,
    session_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    include_args: bool = None,
    include_result: bool = None
):
    """
    Decorator or context manager for tracing.
    
    Can be used as:
    - @trace("operation_name")
    - with trace("operation_name"): ...
    """
    client = get_global_client()
    
    # If called with just the operation name, return a decorator
    if callable(operation):
        func = operation
        return client.trace_decorator()(func)
    
    # If used as decorator factory
    def decorator_factory(func):
        return client.trace_decorator(
            operation, session_id, metadata, include_args, include_result
        )(func)
    
    # Check if being used as context manager
    if hasattr(operation, '__enter__'):
        return operation
        
    # Return context manager
    return client.trace(operation, session_id, metadata, include_args, include_result)
