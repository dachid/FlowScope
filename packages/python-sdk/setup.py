"""
FlowScope Python SDK Setup
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="flowscope",
    version="0.1.0",
    author="FlowScope Team",
    author_email="team@flowscope.dev",
    description="AI/LLM debugging and observability platform for Python",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/flowscope/flowscope",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Debugging",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "httpx>=0.24.0",
        "websockets>=11.0.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "langchain": ["langchain>=0.1.0"],
        "llamaindex": ["llama-index>=0.9.0"],
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "isort>=5.0.0",
            "mypy>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "flowscope=flowscope.cli:main",
        ],
    },
)
