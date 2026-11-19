import os
import json
import httpx
from typing import List, Optional, Dict, Any
from app.core.config import settings

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
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        self.rest_url = f"{self.url}/rest/v1" if self.url else ""
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        } if self.key else {}

    def is_connected(self) -> bool:
        return bool(self.url and self.key)

    async def save_investigation(self, analysis_data: Dict[str, Any], user_id: Optional[str] = None) -> bool:
        inv_id = analysis_data["investigation_id"]

        # 1. Direct REST or SDK to Supabase
        if self.is_connected():
            try:
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

                async with httpx.AsyncClient(timeout=10.0) as client:
                    # Insert investigations
                    r1 = await client.post(f"{self.rest_url}/investigations", headers=self.headers, json=inv_row)
                    # Insert analysis_results
                    r2 = await client.post(f"{self.rest_url}/analysis_results", headers=self.headers, json=res_row)

                if r1.status_code in [200, 201] and r2.status_code in [200, 201]:
                    return True
                else:
                    print(f"[SupabaseService] REST status: inv={r1.status_code}, res={r2.status_code}")
            except Exception as e:
                print(f"[SupabaseService] Error saving to Supabase: {e}")

        # 2. Local fallback store
        items = _load_local_store()
        items = [i for i in items if i.get("investigation_id") != inv_id]
        items.insert(0, analysis_data)
        _save_local_store(items[:100])
        return True

    async def list_investigations(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected():
            try:
                url = f"{self.rest_url}/investigations?select=*&order=created_at.desc"
                if user_id:
                    url += f"&user_id=eq.{user_id}"

                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.get(url, headers=self.headers)
                    if r.status_code == 200:
                        return r.json()
            except Exception as e:
                print(f"[SupabaseService] Error listing from Supabase: {e}")

        items = _load_local_store()
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
        if self.is_connected():
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r1 = await client.get(f"{self.rest_url}/investigations?id=eq.{investigation_id}&select=*", headers=self.headers)
                    r2 = await client.get(f"{self.rest_url}/analysis_results?investigation_id=eq.{investigation_id}&select=*", headers=self.headers)

                    if r1.status_code == 200 and r2.status_code == 200:
                        inv_data = r1.json()
                        res_data = r2.json()
                        if inv_data and res_data:
                            inv = inv_data[0]
                            res = res_data[0]
                            return {
                                "investigation_id": inv["id"],
                                "image_name": inv["image_name"],
                                "image_hash": inv["image_hash"],
                                "assessment": inv["assessment"],
                                "indicator_score": inv["indicator_score"],
                                "created_at": inv["created_at"],
                                "metadata": res.get("metadata_results", {}),
                                "technical": res.get("technical_results", {}),
                                "ai_analysis": res.get("ai_results", {}),
                                "caption_comparison": res.get("caption_results", {}),
                                "evidence_scorecard": res.get("evidence_scorecard", []),
                                "limitations": res.get("limitations", []),
                                "recommendations": [
                                    "Verify original provenance or raw source file.",
                                    "Cross-reference source news wire publication.",
                                    "Perform reverse image search."
                                ],
                                "summary": f"Investigation {inv['id']} details retrieved from Supabase."
                            }
            except Exception as e:
                print(f"[SupabaseService] Error loading from Supabase: {e}")

        items = _load_local_store()
        for i in items:
            if i.get("investigation_id") == investigation_id:
                return i
        return None

    async def delete_investigation(self, investigation_id: str, user_id: Optional[str] = None) -> bool:
        if self.is_connected():
            try:
                url = f"{self.rest_url}/investigations?id=eq.{investigation_id}"
                if user_id:
                    url += f"&user_id=eq.{user_id}"

                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.delete(url, headers=self.headers)
                    if r.status_code in [200, 204]:
                        return True
            except Exception as e:
                print(f"[SupabaseService] Delete error: {e}")

        items = _load_local_store()
        items = [i for i in items if i.get("investigation_id") != investigation_id]
        _save_local_store(items)
        return True

supabase_service = SupabaseService()
