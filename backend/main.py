import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import router as api_router

app = FastAPI(
    title="Futuristic AI Interview Simulator API",
    description="Backend API powering the cyberpunk resume parser and voice grading simulator.",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits requests from React Vite on localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Neuro-Interview Core v1.0",
        "details": "Ready for upload resume and audio inputs."
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
