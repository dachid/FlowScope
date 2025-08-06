#!/usr/bin/env python3
"""
Test script to verify Python SDK build and functionality
"""

from flowscope import FlowScopeClient, trace, configure, get_client

print("✅ FlowScope imports successful")

# Test client creation
client = FlowScopeClient()
print("✅ FlowScopeClient created successfully")

# Test global client access
global_client = get_client()
print("✅ Global client accessed successfully")

# Test trace decorator
@trace
def test_function():
    """A simple test function to verify tracing works"""
    return "Hello from traced function!"

result = test_function()
print(f"✅ Traced function executed: {result}")

# Test configuration
configure(endpoint="http://localhost:31847")
print("✅ Configuration successful")

print("\n🎉 All Python SDK build tests passed!")
