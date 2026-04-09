from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import google.generativeai as genai
import requests
from dotenv import load_dotenv
from components.connection import connection
from ml_models.failure_predictor import StudentFailurePredictor
from ai.vector_search import vector_store
import bcrypt
import jwt
import datetime

load_dotenv()

app = FastAPI(title="LearnSphere AI API")

# Setup Auth
# pwd_context removed in favor of direct bcrypt
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")

# DB connection
db = connection()
users_col = db["users"]

# Initialize AI/ML
predictor = StudentFailurePredictor()
gemini_api_key = os.getenv("GEMMA_API_KEY")
genai.configure(api_key=gemini_api_key)

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup")
async def signup(user: UserRegister):
    try:
        if users_col.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Direct bcrypt hashing
        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = {
            "name": user.name,
            "email": user.email,
            "password": hashed_password,
            "age": user.age,
            "created_at": datetime.datetime.utcnow()
        }
        users_col.insert_one(new_user)
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        existing_user = users_col.find_one({"email": user.email})
        
        if not existing_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if "password" not in existing_user:
             raise HTTPException(status_code=500, detail="User record is malformed (missing password)")

        try:
            # Direct bcrypt verification
            if not bcrypt.checkpw(user.password.encode('utf-8'), existing_user["password"].encode('utf-8')):
                raise HTTPException(status_code=401, detail="Invalid email or password")
        except ValueError as e:
            # Handle bcrypt 72 character limit or other hashing issues
            print(f"Password verification error: {e}")
            raise HTTPException(status_code=401, detail="Invalid password format or verification failure")

        token = jwt.encode({
            "email": user.email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, JWT_SECRET, algorithm="HS256")
        
        return {
            "token": token, 
            "email": user.email,
            "user": {
                "name": existing_user.get("name", "User"),
                "email": existing_user["email"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class ChatRequest(BaseModel):
    query: str

class PredictRequest(BaseModel):
    metrics: List[float] # [study_hours, attendance_rate, previous_score, engagement_score]

class FeedbackRequest(BaseModel):
    feedback: str

class RecommendationRequest(BaseModel):
    risk_level: str
    scores: dict

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """AI Chat endpoint using Gemini with RAG support."""
    # RAG: Search for relevant context
    context = vector_store.search(req.query, k=2)
    enriched_query = f"Context: {context}\n\nQuestion: {req.query}" if context else req.query
    
    chat_session = model.start_chat()
    response = chat_session.send_message(enriched_query)
    
    return {
        "response": response.text,
        "context_used": context
    }

@app.post("/api/predict-risk")
async def predict_risk(req: PredictRequest):
    """Predicts a student's failure risk."""
    if len(req.metrics) != 4:
        raise HTTPException(status_code=400, detail="Invalid metrics. Need 4 values.")
        
    res, prob = predictor.predict(req.metrics)
    
    return {
        "risk_level": "High" if res else "Low",
        "risk_probability": round(prob, 2),
        "status": "Fail Risk" if res else "On Track"
    }

@app.post("/api/wellbeing-risk")
async def wellbeing_risk(req: FeedbackRequest):
    """AI-based analysis of student wellbeing sentiment."""
    prompt = f"Analyze student feedback for burnout risk. Feedback: {req.feedback}"
    response = model.generate_content(prompt)
    return {"analysis": response.text}

@app.post("/api/support-recommendations")
async def support_recommendations(req: RecommendationRequest):
    """AI-driven support suggestions."""
    prompt = f"Student risk: {req.risk_level}, Scores: {req.scores}. Provide 3 recommendations."
    response = model.generate_content(prompt)
    return {"recommendations": response.text}

# YouTube Logic
def fetch_youtube_video(title):
    youtube_api_key = os.getenv("YOUTUBE_API_KEY")
    if not youtube_api_key: return None, None
    search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q={title}&type=video&key={youtube_api_key}"
    try:
        r = requests.get(search_url).json()
        if 'items' in r and len(r['items']) > 0:
            item = r['items'][0]
            return f"https://www.youtube.com/embed/{item['id']['videoId']}", item['snippet']['title']
    except: pass
    return None, None

class CourseRequest(BaseModel):
    topic: str
    no_of_chapters: int = 5

@app.post("/api/generate-course")
async def generate_course(req: CourseRequest):
    chapters = []
    for i in range(req.no_of_chapters):
        url, title = fetch_youtube_video(f"{req.topic} Chapter {i + 1}")
        chapters.append({"title": f"{req.topic} Chapter {i + 1}", "video_url": url, "video_title": title})
    return {"chapters": chapters}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))