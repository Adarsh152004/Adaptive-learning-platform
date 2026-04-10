from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import google.generativeai as genai
import requests
import requests.utils
from groq import Groq
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

# Groq Client Initialization (Llama-3-8b Fallback)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

async def call_ai_with_failover(prompt, system_instruction="You are a helpful learning assistant."):
    """Robust AI caller with Gemini -> Groq -> Local fallback chain."""
    # 1. Primary: Gemini
    try:
        full_prompt = f"{system_instruction}\n\nUser: {prompt}"
        response = model.generate_content(full_prompt)
        if response and response.text:
            return response.text, "Gemini (Primary)"
    except Exception as e:
        print(f"Gemini Fallback Triggered: {e}")

    # 2. Secondary: Groq (Llama-3)
    if groq_client:
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",
            )
            if chat_completion.choices[0].message.content:
                return chat_completion.choices[0].message.content, "Groq (Secondary)"
        except Exception as e:
            print(f"Groq Fallback Triggered: {e}")

    # 3. Tertiary: Local Smart Mock (Ensures platform never 'crashes')
    return (
        "I'm currently performing some internal knowledge updates. "
        "Based on your query, I recommend we review the core fundamentals together. "
        "Could you tell me what specific part of this topic you find most challenging?"
    ), "Local (Emergency Fallback)"

# Enable CORS for Next.js frontend (Fixed for credentials+browsers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    """Temporary Auth Bypass: Signup always succeeds."""
    return {"message": "User registered successfully (BYPASS)", "user": {"email": user.email}}
    # try:
    #     auth_res = db.auth.sign_up({
    #         "email": user.email,
    #         "password": user.password,
    #         "options": {
    #             "data": {
    #                 "full_name": user.name,
    #                 "age": user.age
    #             }
    #         }
    #     })
    #     
    #     if not auth_res.user:
    #         raise HTTPException(status_code=400, detail="Signup failed")
    # 
    #     db.table("profiles").update({
    #         "name": user.name,
    #         "age": user.age
    #     }).eq("id", auth_res.user.id).execute()
    # 
    #     return {"message": "User registered successfully", "user": {"email": auth_res.user.email}}
    # except Exception as e:
    #     print(f"Signup error: {e}")
    #     raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    """Temporary Auth Bypass: Any login succeeds."""
    return {
        "token": "dummy_bypass_token", 
        "email": user.email,
        "user": {
            "name": "Adarsh (Guest)",
            "email": user.email
        }
    }
    # try:
    #     auth_res = db.auth.sign_in_with_password({
    #         "email": user.email,
    #         "password": user.password
    #     })
    #     
    #     if not auth_res.session:
    #         raise HTTPException(status_code=401, detail="Invalid email or password")
    # 
    #     profile_res = db.table("profiles").select("*").eq("id", auth_res.user.id).single().execute()
    #     profile_data = profile_res.data if profile_res.data else {}
    # 
    #     return {
    #         "token": auth_res.session.access_token, 
    #         "email": user.email,
    #         "user": {
    #             "name": profile_data.get("name", "User"),
    #             "email": user.email
    #         }
    #     }
    # except Exception as e:
    #     print(f"Login error: {e}")
    #     raise HTTPException(status_code=401, detail="Authentication failed")

class ChatRequest(BaseModel):
    query: str

class PredictRequest(BaseModel):
    metrics: List[float] # [study_hours, attendance_rate, previous_score, engagement_score]

class FeedbackRequest(BaseModel):
    feedback: str

class RecommendationRequest(BaseModel):
    risk_level: str
    scores: dict

class ImageRequest(BaseModel):
    prompt: str

@app.post("/api/generate-image")
async def generate_image(req: ImageRequest):
    """Free AI Image Generation using Pollinations V7 (High Reliability)."""
    try:
        # Improved formatting for the Pollinations Image engine
        encoded_prompt = requests.utils.quote(req.prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&private=true"
        return {"image_url": image_url}
    except Exception as e:
        print(f"Image Gen Error: {e}")
        return {"image_url": "https://image.pollinations.ai/prompt/educational-abstract-art?width=1024&height=1024"}

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """AI Chat endpoint using Multi-Model Failover logic."""
    try:
        if not req.query:
            return {"response": "I'm ready to help! What's on your mind?", "context_used": "User Input"}

        response_text, provider = await call_ai_with_failover(req.query)
        return {
            "response": response_text,
            "context_used": f"LearnSphere AI Hub ({provider})"
        }
    except Exception as e:
        print(f"Chat Global Error: {e}")
        return {"response": "I'm optimizing my learning paths. Please ask again in a moment!", "context_used": "Recovery Mode"}

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
        response_text, provider = await call_ai_with_failover(prompt, system_instruction="Act as a student performance predictor.")
        # Parse JSON from response
        import json
        clean_text = response_text.strip().replace("```json", "").replace("```", "")
        data = json.loads(clean_text)
        
        return {
            "risk_level": data.get("risk", "Low"),
            "risk_probability": data.get("probability", 0.5),
            "status": f"{data.get('status', 'On Track')} (via {provider})"
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback logic
        risk = "High" if (study < 3 or attendance < 0.6 or prev < 50) else "Low"
        return {"risk_level": risk, "risk_probability": 0.8 if risk == "High" else 0.2, "status": "Fail Risk (Local)" if risk == "High" else "On Track (Local)"}

@app.post("/api/wellbeing-risk")
async def wellbeing_risk(req: FeedbackRequest):
    """AI-based analysis of student wellbeing sentiment (Failover)."""
    prompt = f"Analyze student feedback for burnout risk. Feedback: {req.feedback}. Provide a concise assessment."
    analysis, provider = await call_ai_with_failover(prompt, system_instruction="You are a mental health and student wellbeing analyst.")
    return {"analysis": f"{analysis}\n\n[Analysis provided by {provider}]"}

@app.post("/api/support-recommendations")
async def support_recommendations(req: RecommendationRequest):
    """AI-driven support suggestions (Failover)."""
    prompt = f"Student risk: {req.risk_level}, Scores: {req.scores}. Provide 3 specific academic recommendations."
    recommendations, provider = await call_ai_with_failover(prompt, system_instruction="You are an academic advisor.")
    return {"recommendations": f"{recommendations}\n\n[Advised by {provider}]"}

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
    """Enhanced Course Generator with AI Thumbnails & Fallback Logic."""
    chapters = []
    try:
        # Use Gemini to generate chapter titles
        prompt = (
            f"Generate {req.no_of_chapters} specific, comprehensive chapter titles for the topic: '{req.topic}'. "
            f"Each title should be educational and distinct. Return only the titles as a bulleted list."
        )
        
        try:
            titles_res, provider = await call_ai_with_failover(prompt, system_instruction="You are a course curriculum designer.")
            titles_list = titles_res.split('\n')
            titles = [t.strip('- ').strip() for t in titles_list if t.strip() and len(t) > 3][:req.no_of_chapters]
        except Exception as e:
            print(f"Gemini titles generation failed: {e}")
            titles = [f"Introduction to {req.topic}", f"Core Principles of {req.topic}", f"Advanced {req.topic} Techniques", f"Real-world Applications of {req.topic}", f"Conclusion and Next Steps"]
            titles = titles[:req.no_of_chapters]
        
        for i, search_title in enumerate(titles):
            # 1. Fetch Video
            video_url, video_title = fetch_youtube_video(f"{req.topic} {search_title}")
            
            # 2. Generate Chapter Thumbnail (Improved URL format)
            image_prompt = f"Modern educational 3D icon for {search_title}, high resolution, scientific style"
            encoded_prompt = requests.utils.quote(image_prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&nologo=true&seed={i+100}"
            
            chapters.append({
                "title": search_title, 
                "video_url": video_url or "", 
                "video_title": video_title or search_title,
                "image_url": image_url
            })
            
        return {"chapters": chapters}
    except Exception as e:
        print(f"Course Generation Critical Error: {e}")
        # Final fallback to ensure the UI doesn't break
        return {
            "chapters": [
                {"title": f"Welcome to {req.topic}", "video_url": "", "video_title": "Course Overview", "image_url": "https://pollinations.ai/p/educational-shield?width=1280&height=720"}
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))