"""
FlowScope Python SDK

AI/LLM debugging and observability platform for Python applications.
Supports LangChain, LlamaIndex, and custom AI workflows.
"""

__version__ = "0.1.0"
__author__ = "FlowScope Team"

from .core import FlowScopeClient, trace, init
from .context import with_context, current_context
from .auto import auto_instrument, configure_auto_instrumentation

# Main client instance - initialized lazily
_client = None

def get_client():
    """Get the global FlowScope client instance."""
    global _client
    if _client is None:
        _client = FlowScopeClient()
    return _client

# Convenience functions that use the global client
def configure(config=None, **kwargs):
    """Configure the global FlowScope client."""
    return get_client().configure(config, **kwargs)

def flush():
    """Flush all pending traces."""
    return get_client().flush()

def create_session(session_id=None, metadata=None):
    """Create a new debugging session."""
    return get_client().create_session(session_id, metadata)

def set_session(session_id):
    """Set the active session."""
    return get_client().set_session(session_id)

# Export commonly used items
__all__ = [
    # Core functionality
    'FlowScopeClient', 'trace', 'init', 'configure', 'flush',
    # Session management
    'create_session', 'set_session',
    # Context management
    'with_context', 'current_context',
    # Auto-instrumentation
    'auto_instrument', 'configure_auto_instrumentation',
    # Client access
    'get_client',
]
