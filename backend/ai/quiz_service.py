from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from components.connection import connection

router = APIRouter()
db = connection()

class QuizResult(BaseModel):
    user_id: str
    topic: str
    score: int
    total_questions: int
    difficulty: str

class WellbeingLog(BaseModel):
    user_id: str
    mood_score: int
    stress_level: str
    feedback_text: str

@router.post("/api/evaluate-quiz")
async def evaluate_quiz(req: QuizResult):
    try:
        res = db.table("quiz_performance").insert({
            "user_id": req.user_id,
            "topic": req.topic,
            "score": req.score,
            "total_questions": req.total_questions,
            "difficulty": req.difficulty
        }).execute()
        return {"status": "success", "message": "Quiz performance tracked for adaptive logic."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/log-wellbeing")
async def log_wellbeing(req: WellbeingLog):
    try:
        res = db.table("wellbeing_logs").insert({
            "user_id": req.user_id,
            "mood_score": req.mood_score,
            "stress_level": req.stress_level,
            "feedback_text": req.feedback_text
        }).execute()
        return {"status": "success", "message": "Wellbeing tracked."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
