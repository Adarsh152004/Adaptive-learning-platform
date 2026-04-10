from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import google.generativeai as genai
import requests
from dotenv import load_dotenv
from components.connection import connection
import datetime

load_dotenv()

app = FastAPI(title="LearnSphere AI API")

# DB connection (Supabase)
db = connection()

# Initialize Gemini
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
        # 1. Sign up user in Supabase Auth
        auth_res = db.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.name,
                    "age": user.age
                }
            }
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Signup failed")

        # 2. Update profile in public.profiles (Trigger handles insertion, we update name/age if needed)
        # However, metadata in sign_up is usually enough. Assuming trigger works.
        db.table("profiles").update({
            "name": user.name,
            "age": user.age
        }).eq("id", auth_res.user.id).execute()

        return {"message": "User registered successfully", "user": {"email": auth_res.user.email}}
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        # Sign in with Supabase Auth
        auth_res = db.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Get user details from profiles
        profile_res = db.table("profiles").select("*").eq("id", auth_res.user.id).single().execute()
        profile_data = profile_res.data if profile_res.data else {}

        return {
            "token": auth_res.session.access_token, 
            "email": user.email,
            "user": {
                "name": profile_data.get("name", "User"),
                "email": user.email
            }
        }
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

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
    """AI Chat endpoint using Gemini (Stable)."""
    try:
        # Simple context discovery via Gemini instead of local FAISS if index is broken
        prompt = f"Help the student with this query: {req.query}"
        chat_session = model.start_chat()
        response = chat_session.send_message(prompt)
        
        return {
            "response": response.text,
            "context_used": "Gemini Knowledge Base"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-risk")
async def predict_risk(req: PredictRequest):
    """Predicts a student's failure risk using Gemini (Stable)."""
    if len(req.metrics) != 4:
        raise HTTPException(status_code=400, detail="Invalid metrics. Need 4 values.")
    
    study, attendance, prev, engage = req.metrics
    prompt = (
        f"Act as a student performance predictor. Based on these metrics:\n"
        f"- Study Hours: {study}\n"
        f"- Attendance Rate: {attendance}%\n"
        f"- Previous Score: {prev}/100\n"
        f"- Engagement Score: {engage}/100\n"
        f"Predict if the student is at risk of failing (High/Low). "
        f"Return ONLY a JSON object: {{\"risk\": \"High\" | \"Low\", \"probability\": <number 0-1>, \"status\": \"Fail Risk\" | \"On Track\"}}"
    )
    
    try:
        response = model.generate_content(prompt)
        # Parse JSON from response
        import json
        clean_text = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(clean_text)
        
        return {
            "risk_level": data.get("risk", "Low"),
            "risk_probability": data.get("probability", 0.5),
            "status": data.get("status", "On Track")
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback logic
        risk = "High" if (study < 3 or attendance < 0.6 or prev < 50) else "Low"
        return {"risk_level": risk, "risk_probability": 0.8 if risk == "High" else 0.2, "status": "Fail Risk" if risk == "High" else "On Track"}

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
    # Use Gemini to generate chapter titles first for better YouTube search
    prompt = f"Suggest {req.no_of_chapters} specific educational chapter titles for the topic: {req.topic}. Return only the titles as a bulleted list."
    titles_res = model.generate_content(prompt).text.split('\n')
    titles = [t.strip('- ').strip() for t in titles_res if t.strip()]
    
    for i in range(min(req.no_of_chapters, len(titles))):
        search_title = titles[i]
        url, title = fetch_youtube_video(search_title)
        chapters.append({"title": search_title, "video_url": url, "video_title": title})
    return {"chapters": chapters}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))