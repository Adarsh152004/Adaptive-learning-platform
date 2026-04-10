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
from ai import recommendation_service
from ai import quiz_service
from ai.pinecone_service import pinecone_store
import datetime

load_dotenv()

app = FastAPI(title="LearnSphere AI API")

# Register recommendation router
app.include_router(recommendation_service.router)
app.include_router(quiz_service.router)

@app.get("/api/health")
async def global_health():
    return {"status": "LearnSphere AI Hub is Online", "version": "2.0.0"}
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
    """Robust AI caller with Pinecone RAG + Gemini -> Groq fallback chain."""
    
    # AI Hub RAG: Get application context from Pinecone
    context = ""
    try:
        context_matches = pinecone_store.query_documents(prompt, top_k=2)
        if context_matches:
            context = "\n\nRelevant Application Context:\n" + "\n---\n".join(context_matches)
    except Exception as e:
        print(f"RAG Context Retrieval Failed: {e}")

    system_with_context = f"{system_instruction}{context}"

    # 1. Primary: Gemini
    try:
        full_prompt = f"{system_with_context}\n\nUser: {prompt}"
        response = model.generate_content(full_prompt)
        if response and response.text:
            return response.text, "Gemini (RAG-Enhanced)"
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
    role: str = "student" # "teacher" or "student"
    batch_code: Optional[str] = None # Required for students
    batch_name: Optional[str] = None # Optional for teachers to name their batch

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup")
async def signup(user: UserRegister):
    """Secure Signup with Role & Batch logic."""
    print(f"--- Starting Signup for {user.email} ---")
    try:
        # 1. Sign up user in Supabase Auth
        print("[1/3] Attempting Supabase Auth Sign-up...")
        auth_res = db.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.name
                }
            }
        })
        
        if not auth_res.user:
            print("[ERROR] Auth result returned no user.")
            raise HTTPException(status_code=400, detail="Signup failed at Auth level")

        user_id = auth_res.user.id
        batch_id = None
        print(f"[SUCCESS] Auth user created: {user_id}")

        # 2. Handle Batch Logic
        print("[2/3] Processing Batch Logic...")
        if user.role == "teacher":
            # Teachers create a new batch
            batch_code = user.batch_code or f"BATCH-{datetime.datetime.now().strftime('%Y%H%M')}"
            batch_res = db.table("batches").insert({
                "teacher_id": user_id,
                "batch_code": batch_code,
                "batch_name": user.batch_name or f"{user.name}'s Batch"
            }).execute()
            
            if not batch_res.data:
                print("[ERROR] Batch creation failed.")
                raise HTTPException(status_code=500, detail="Failed to create batch")
                
            batch_id = batch_res.data[0]['id']
            print(f"[SUCCESS] Batch created with ID: {batch_id}")
            
        elif user.role == "student":
            # Students must join an existing batch
            if not user.batch_code:
                raise HTTPException(status_code=400, detail="Batch code is required for students")
            
            print(f"Looking up batch code: {user.batch_code}")
            batch_lookup = db.table("batches").select("id").eq("batch_code", user.batch_code).execute()
            if not batch_lookup.data:
                print("[ERROR] Invalid batch code provided.")
                raise HTTPException(status_code=404, detail="Invalid batch code")
            batch_id = batch_lookup.data[0]['id']
            print(f"[SUCCESS] Joined batch ID: {batch_id}")

        # 3. Create Profile
        print("[3/3] Creating Profile record...")
        db.table("profiles").insert({
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "role": user.role,
            "batch_id": batch_id
        }).execute()
        print("[SUCCESS] Profile record created.")

        return {"message": "User registered successfully", "user": {"email": user.email, "role": user.role}}
    except Exception as e:
        err_msg = str(e)
        print(f"Signup error: {err_msg}")
        # Specific friendly messages
        if "already registered" in err_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered. Please login.")
        if "password" in err_msg.lower() and "confirm" in err_msg.lower():
            raise HTTPException(status_code=400, detail="Email confirmation required by Supabase.")
        
        raise HTTPException(status_code=400, detail=err_msg)

@app.post("/auth/login")
async def login(user: UserLogin):
    """Secure Login with Role retrieval."""
    print(f"--- Starting Login for {user.email} ---")
    try:
        auth_res = db.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Fetch profile data with role and batch info
        profile_res = db.table("profiles").select("*, batches(batch_code, batch_name)").eq("id", auth_res.user.id).execute()
        profile_data = profile_res.data[0] if profile_res.data else {}

        print(f"[SUCCESS] Login successful for {user.email}")
        return {
            "token": auth_res.session.access_token, 
            "user": {
                "id": auth_res.user.id,
                "name": profile_data.get("name", "User"),
                "email": user.email,
                "role": profile_data.get("role", "student"),
                "batch_id": profile_data.get("batch_id"),
                "batch_info": profile_data.get("batches")
            }
        }
    except Exception as e:
        err_msg = str(e)
        print(f"Login error: {err_msg}")
        if "confirm your email" in err_msg.lower():
             raise HTTPException(status_code=401, detail="EMAIL_NOT_CONFIRMED")
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.get("/api/teacher/students")
async def get_teacher_students(teacher_id: str):
    """Fetch students and their performance for a specific teacher."""
    try:
        # 1. Get Teacher's batch
        batch_res = db.table("batches").select("id").eq("teacher_id", teacher_id).single().execute()
        if not batch_res.data:
            return {"students": []}
        
        batch_id = batch_res.data['id']

        # 2. Get Students and their latest quiz/wellbeing data
        students_res = db.table("profiles").select("id, name, email").eq("batch_id", batch_id).execute()
        students = students_res.data

        detailed_students = []
        for student in students:
            # Latest Quiz Performance
            quiz_res = db.table("quiz_performance").select("*").eq("user_id", student['id']).order("created_at", desc=True).limit(5).execute()
            # Latest Wellbeing
            wellbeing_res = db.table("wellbeing_logs").select("*").eq("user_id", student['id']).order("created_at", desc=True).limit(1).execute()
            
            detailed_students.append({
                **student,
                "quizzes": quiz_res.data,
                "wellbeing": wellbeing_res.data[0] if wellbeing_res.data else None
            })

        return {"students": detailed_students}
    except Exception as e:
        print(f"Teacher view error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        # Final fallback to ensure the UI doesn't break
        print(f"Applying Smart Local Fallback for topic: {req.topic}")
        # Predefined templates that work for almost any topic
        templates = [
            {"title": f"Introductory {req.topic} Concepts", "video_title": f"Getting Started with {req.topic}", "img_key": "physics"},
            {"title": f"Core Foundations of {req.topic}", "video_title": f"Critical Theory of {req.topic}", "img_key": "shield"},
            {"title": f"Practical {req.topic} Techniques", "video_title": f"Hands-on {req.topic} Mastery", "img_key": "course"},
            {"title": f"Advanced {req.topic} Architecture", "video_title": f"Scaling {req.topic} Solutions", "img_key": "robot"},
            {"title": f"The Future of {req.topic}", "video_title": f"Modern Trends in {req.topic}", "img_key": "neural"}
        ]
        
        fallback_chapters = []
        for i, t in enumerate(templates[:req.no_of_chapters]):
            image_url = f"https://pollinations.ai/p/{t['img_key']}?width=1280&height=720&seed={i}"
            fallback_chapters.append({
                "title": t["title"],
                "video_url": "",
                "video_title": t["video_title"],
                "image_url": image_url
            })
            
        return {"chapters": fallback_chapters}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))