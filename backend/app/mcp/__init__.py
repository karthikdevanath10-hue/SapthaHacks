"""
TruthLens Model Context Protocol (MCP) Module
Provides MCP Server & Client architecture for Web & Social Media Presence Discovery.
"""

from app.mcp.client import mcp_client
from app.mcp.server import mcp_server

__all__ = ["mcp_client", "mcp_server"]
