from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from backend.app.services import AIService
from typing import List, Dict, Any, Optional

router = APIRouter()
ai_service = AIService()

# Pydantic Schemas for Requests
class StartInterviewRequest(BaseModel):
    parsed_resume: Dict[str, Any]
    role: str
    difficulty: str
    company: str

class EvaluateAnswerRequest(BaseModel):
    question: str
    type: str
    answer: str
    target_role: str

class EvaluateCodingRequest(BaseModel):
    question: str
    code: str
    expected_output: str

class GenerateRoadmapRequest(BaseModel):
    parsed_resume: Dict[str, Any]
    interview_scores: List[Dict[str, Any]]
    role: str

class MentorChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]

# API Endpoints
@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), role: str = Form(...)):
    try:
        content = await file.read()
        filename = file.filename
        text = ai_service.extract_text_from_file(content, filename)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text content from the uploaded file.")
            
        analysis = ai_service.analyze_resume(text, role)
        return {
            "filename": filename,
            "analysis": analysis,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview/start")
def start_interview(req: StartInterviewRequest):
    try:
        questions = ai_service.generate_questions(
            parsed_resume=req.parsed_resume,
            role=req.role,
            difficulty=req.difficulty,
            company=req.company
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview/evaluate")
def evaluate_answer(req: EvaluateAnswerRequest):
    try:
        evaluation = ai_service.evaluate_answer(
            question=req.question,
            type=req.type,
            answer=req.answer,
            target_role=req.target_role
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview/coding")
def evaluate_coding(req: EvaluateCodingRequest):
    try:
        evaluation = ai_service.evaluate_coding_challenge(
            question=req.question,
            code=req.code,
            expected_output=req.expected_output
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roadmap")
def get_roadmap(req: GenerateRoadmapRequest):
    try:
        roadmap = ai_service.generate_career_roadmap(
            parsed_resume=req.parsed_resume,
            interview_scores=req.interview_scores,
            role=req.role
        )
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mentor")
def chat_mentor(req: MentorChatRequest):
    try:
        reply = ai_service.chat_mentor(message=req.message, context=req.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
