"""
TruthLens Model Context Protocol (MCP) Tools Registry.
Defines schemas for reverse media lookup and Instagram/web presence detection.
"""

from typing import Dict, Any, List

MCP_TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "search_web_presence",
        "description": "Searches Instagram, Twitter/X, Reddit, TikTok, news agencies, and the open web to identify whether a specific photo, video clip, audio soundbite, or headline has previously been published or indexed online.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query, visual summary, viral caption, or prominent entities to locate across the web."
                },
                "modality": {
                    "type": "string",
                    "enum": ["image", "video", "audio", "text"],
                    "description": "The media modality being searched."
                },
                "platform": {
                    "type": "string",
                    "enum": ["all", "instagram", "twitter", "reddit", "news"],
                    "description": "Target platform or 'all' for cross-platform open web search."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "reverse_media_lookup",
        "description": "Executes reverse media lookup using semantic visual descriptors, landmarks, faces, objects, and speech snippets to trace original publication date, source origin, and previous debunk status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "visual_description": {
                    "type": "string",
                    "description": "Detailed scene, background, lighting, and object composition."
                },
                "key_entities": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Recognized public figures, brands, locations, or objects."
                },
                "caption": {
                    "type": "string",
                    "description": "Accompanying claim or caption to cross-verify against web index."
                }
            },
            "required": ["visual_description"]
        }
    },
    {
        "name": "check_social_platforms",
        "description": "Probes social networks (Instagram, X / Twitter, Reddit, TikTok) for viral reposts, matching hashtags, and community debunking threads.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "Keywords or headline to search."
                },
                "platforms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of social platforms to probe."
                }
            },
            "required": ["keywords"]
        }
    }
]
