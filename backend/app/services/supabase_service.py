import os
import json
from typing import List, Optional, Dict, Any
from app.core.config import settings

# In-memory / local fallback store for seamless offline/development hackathon running
LOCAL_STORE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "local_investigations.json")

def _load_local_store() -> List[Dict[str, Any]]:
    if os.path.exists(LOCAL_STORE_PATH):
        try:
            with open(LOCAL_STORE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def _save_local_store(data: List[Dict[str, Any]]):
    try:
        with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception:
        pass

class SupabaseService:
    def __init__(self):
        self.client = None
        if settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY):
            try:
                from supabase import create_client, Client
                key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
                self.client: Optional[Client] = create_client(settings.SUPABASE_URL, key)
            except Exception as e:
                print(f"[SupabaseService] Failed to initialize client: {e}")
                self.client = None

    def is_connected(self) -> bool:
        return self.client is not None

    async def save_investigation(self, analysis_data: Dict[str, Any], user_id: Optional[str] = None) -> bool:
        inv_id = analysis_data["investigation_id"]
        
        # 1. If Supabase is connected, write to Supabase tables
        if self.client:
            try:
                # Insert into investigations
                inv_row = {
                    "id": inv_id,
                    "user_id": user_id,
                    "image_name": analysis_data["image_name"],
                    "image_hash": analysis_data["image_hash"],
                    "image_size_bytes": analysis_data["metadata"]["file_size_bytes"],
                    "caption": analysis_data["caption_comparison"].get("caption_text"),
                    "source_context": analysis_data["caption_comparison"].get("source_context"),
                    "status": "completed",
                    "assessment": analysis_data["assessment"],
                    "indicator_score": analysis_data["indicator_score"],
                    "created_at": analysis_data["created_at"]
                }
                self.client.table("investigations").insert(inv_row).execute()

                # Insert into analysis_results
                res_row = {
                    "investigation_id": inv_id,
                    "metadata_results": analysis_data["metadata"],
                    "technical_results": analysis_data["technical"],
                    "ai_results": analysis_data["ai_analysis"],
                    "caption_results": analysis_data["caption_comparison"],
                    "evidence_scorecard": analysis_data["evidence_scorecard"],
                    "limitations": analysis_data["limitations"],
                    "created_at": analysis_data["created_at"]
                }
                self.client.table("analysis_results").insert(res_row).execute()
                return True
            except Exception as e:
                print(f"[SupabaseService] Error saving to Supabase: {e}. Falling back to local store.")

        # 2. Local fallback store
        items = _load_local_store()
        # Prepend new investigation
        items = [i for i in items if i["investigation_id"] != inv_id]
        items.insert(0, analysis_data)
        _save_local_store(items[:100])
        return True

    async def list_investigations(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.client:
            try:
                query = self.client.table("investigations").select("*").order("created_at", desc=True)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                return res.data or []
            except Exception as e:
                print(f"[SupabaseService] Error querying Supabase: {e}. Using local store.")

        items = _load_local_store()
        # Format matching investigations table
        summary_list = []
        for i in items:
            summary_list.append({
                "id": i.get("investigation_id"),
                "image_name": i.get("image_name"),
                "image_hash": i.get("image_hash"),
                "image_size_bytes": i.get("metadata", {}).get("file_size_bytes", 0),
                "caption": i.get("caption_comparison", {}).get("caption_text"),
                "status": "completed",
                "assessment": i.get("assessment"),
                "indicator_score": i.get("indicator_score", 0),
                "created_at": i.get("created_at")
            })
        return summary_list

    async def get_investigation_details(self, investigation_id: str) -> Optional[Dict[str, Any]]:
        if self.client:
            try:
                inv = self.client.table("investigations").select("*").eq("id", investigation_id).single().execute()
                res = self.client.table("analysis_results").select("*").eq("investigation_id", investigation_id).single().execute()
                if inv.data and res.data:
                    return {
                        "investigation_id": inv.data["id"],
                        "image_name": inv.data["image_name"],
                        "image_hash": inv.data["image_hash"],
                        "assessment": inv.data["assessment"],
                        "indicator_score": inv.data["indicator_score"],
                        "created_at": inv.data["created_at"],
                        "metadata": res.data.get("metadata_results", {}),
                        "technical": res.data.get("technical_results", {}),
                        "ai_analysis": res.data.get("ai_results", {}),
                        "caption_comparison": res.data.get("caption_results", {}),
                        "evidence_scorecard": res.data.get("evidence_scorecard", []),
                        "limitations": res.data.get("limitations", []),
                        "recommendations": [
                            "Verify original provenance or raw source file.",
                            "Cross-reference source news wire publication.",
                            "Perform reverse image search."
                        ],
                        "summary": f"Investigation {inv.data['id']} details retrieved from Supabase."
                    }
            except Exception as e:
                print(f"[SupabaseService] Error loading from Supabase: {e}")

        items = _load_local_store()
        for i in items:
            if i.get("investigation_id") == investigation_id:
                return i
        return None

    async def delete_investigation(self, investigation_id: str, user_id: Optional[str] = None) -> bool:
        if self.client:
            try:
                query = self.client.table("investigations").delete().eq("id", investigation_id)
                if user_id:
                    query = query.eq("user_id", user_id)
                query.execute()
                return True
            except Exception as e:
                print(f"[SupabaseService] Delete from Supabase failed: {e}")

        items = _load_local_store()
        items = [i for i in items if i.get("investigation_id") != investigation_id]
        _save_local_store(items)
        return True

supabase_service = SupabaseService()
