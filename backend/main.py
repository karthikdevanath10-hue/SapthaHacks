"""
FastAPI entrypoint for Vercel deployment.
Exposes the FastAPI application object 'app' from app.main.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
