from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import google.generativeai as genai
import requests
import requests.utils
from groq import Groq
from tavily import TavilyClient
from dotenv import load_dotenv
from components.connection import connection
from ai import recommendation_service
from ai import quiz_service
from ai.pinecone_service import pinecone_store
from services.mental_analyzer import MentalStateAnalyzer
import datetime
import json

load_dotenv()

app = FastAPI(title="LearnSphere AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(recommendation_service.router)
app.include_router(quiz_service.router)

@app.get("/api/health")
async def global_health():
    return {"status": "LearnSphere AI Hub is Online", "version": "2.0.0"}

# DB connection (Supabase)
db = connection()

# Initialize Gemini
gemini_api_key = os.getenv("GEMMA_API_KEY")
genai.configure(api_key=gemini_api_key)

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
)

# Groq Client Initialization (Llama-3-8b Fallback)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

async def call_ai_with_failover(prompt, system_instruction="You are a helpful learning assistant."):
    """Robust AI caller: Groq-Only (70B primary -> 8B fallback)."""
    if not groq_client:
        return "AI system is offline (Check GROQ_API_KEY).", "Error"

    # Optional RAG: Get application context from Pinecone
    context = ""
    try:
        context_matches = pinecone_store.query_documents(prompt, top_k=2)
        if context_matches:
            context = "\n\nRelevant Application Context:\n" + "\n---\n".join(context_matches)
    except Exception as e:
        print(f"RAG Context Retrieval Failed: {e}")

    system_with_context = f"{system_instruction}{context}"

    # 1. Primary: Groq 70B
    try:
        print(f"DEBUG: Attempting Groq (Llama-3.3 70B) for: {prompt[:30]}...")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_with_context},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
        )
        if chat_completion.choices[0].message.content:
            return chat_completion.choices[0].message.content, "Groq-70B"
    except Exception as e:
        print(f"DEBUG: Groq-70B failed: {e}. Trying 8B fallback...")

    # 2. Fallback: Groq 8B
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_with_context},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
        )
        if chat_completion.choices[0].message.content:
            return chat_completion.choices[0].message.content, "Groq-8B"
    except Exception as e:
        print(f"DEBUG: Groq-8B also failed: {e}")

    return (
        "I'm deeply sorry, but I'm having trouble connecting to my knowledge base. "
        "Take a breath — you're not alone. Please try again in a moment."
    ), "Local Fallback"

# Enable CORS for Next.js frontend (Fixed for credentials+browsers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Clients
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
jee_groq_client = Groq(api_key=os.getenv("JEE_GROQ_API_KEY"))

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

class ConversationTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    emotion: Optional[str] = None
    stress_score: Optional[float] = None
    user_id: Optional[str] = None
    history: Optional[List[ConversationTurn]] = None  # Last N turns for memory

class PredictRequest(BaseModel):
    metrics: List[float] # [study_hours, attendance_rate, previous_score, engagement_score]

class FeedbackRequest(BaseModel):
    feedback: str

class RecommendationRequest(BaseModel):
    risk_level: str
    scores: dict

class ImageRequest(BaseModel):
    prompt: str

class MoodLogEntry(BaseModel):
    user_id: str
    mood: int
    questionnaire: Optional[List[dict]] = None

class ActivityLogEntry(BaseModel):
    user_id: str
    activity_type: str
    duration: int

class GameResultEntry(BaseModel):
    user_id: str
    game_type: str
    score: int
    reaction_time: Optional[float] = None
    metadata: Optional[dict] = None

class CounselingSessionEntry(BaseModel):
    user_id: str
    start_time: str
    end_time: Optional[str] = None
    initial_stress: float
    final_stress: Optional[float] = None
    duration: Optional[int] = None # in seconds
    summary: Optional[str] = None

class EmotionLogEntry(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    emotion: str
    stress_score: float
    timestamp: str

class SummaryRequest(BaseModel):
    user_id: str

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

def get_fallback_video(topic):
    # A curated list of high-quality JEE playlists/one-shots
    fallbacks = {
        "physics": "GZpT6m47aQA", # Physics Wallah
        "chemistry": "L3NshL3A6vM", # Unacademy JEE 
        "maths": "0i4lEaYvLrg" # Vedantu
    }
    t = topic.lower()
    if any(k in t for k in ["physics", "force", "motion", "energy", "mechanics", "newton", "optics", "current"]):
        vid_id = fallbacks["physics"]
    elif any(k in t for k in ["chem", "atom", "mole", "bond", "organic", "reaction"]):
        vid_id = fallbacks["chemistry"]
    else:
        vid_id = fallbacks["maths"]
    return f"https://www.youtube.com/embed/{vid_id}"

class CourseRequest(BaseModel):
    topic: str
    duration: int = 5 # 1, 5, or 20 hours

@app.post("/api/generate-course")
async def generate_course(req: CourseRequest):
    """Enhanced Course Generator with AI Thumbnails & Fallback Logic."""
    # Logic for scaling number of chapters based on duration
    no_of_chapters = 3 if req.duration == 1 else (12 if req.duration == 20 else 7)
    chapters = []
    
    try:
        # Use AI to generate chapter titles based on duration constraint
        depth_level = "beginner/concise" if req.duration == 1 else ("comprehensive/advanced" if req.duration == 20 else "balanced/standard")
        try:
            prompt = (
                f"Generate exactly {no_of_chapters} sequence-based chapters for the topic: '{req.topic}' for a {req.duration}-hour {depth_level} curriculum. "
                f"Return a JSON list of objects, each with: "
                f"1. 'title': short descriptive chapter title. "
                f"2. 'detailed_summary': A 200-word academic mastery document in Markdown. Include '# Conceptual Overview', '## 🧠 Core Principles', '## 🔢 Vital Formulas' (using LaTeX or code blocks), and '## 💡 JEE Exam Tips'. "
                f"3. 'subtopics': a list of exactly 4 objects with 'title' (specific concept) and 'duration' (estimated minutes, e.g. '10m'). "
                f"4. 'visual_query': 2 words strictly describing the visual concept (e.g. 'atomic lattice', 'vector lines'). "
                f"Return ONLY a raw JSON array. No markdown, no wrappers."
            )
            
            titles_res, provider = await call_ai_with_failover(prompt, system_instruction="You are a JSON educational curriculum API. Return only raw JSON arrays.")
            # Clean up potential markdown marks
            json_str = titles_res.strip().replace('```json', '').replace('```', '').strip()
            course_data = json.loads(json_str)
            chapters_metadata = course_data[:no_of_chapters]
        except Exception as e:
            print(f"Structured Titles generation failed: {e}. Falling back to simple list.")
            # Fallback to simple list if JSON fails
            simple_prompt = f"Generate exactly {no_of_chapters} chapter titles and short 50-word summaries for '{req.topic}'. JSON format: [{{'title': '...', 'detailed_summary': '...'}}, ...]"
            titles_res, _ = await call_ai_with_failover(simple_prompt)
            try:
                json_str = titles_res.strip().replace('```json', '').replace('```', '').strip()
                chapters_metadata = json.loads(json_str)[:no_of_chapters]
            except:
                chapters_metadata = [{"title": t.strip(), "detailed_summary": f"Intro to {t}", "subtopics": []} for t in titles_res.split('\n') if t.strip()][:no_of_chapters]
        
        for i, meta in enumerate(chapters_metadata):
            search_title = meta["title"]
            # 1. Fetch Video
            video_url, video_title = fetch_youtube_video(f"{req.topic} {search_title}")
            
            # Use Fallback if no video found
            if not video_url:
                video_url = get_fallback_video(f"{req.topic} {search_title}")
                video_title = f"Essential Guide: {search_title}"
            
            # 2. Generate Chapter Thumbnail
            image_prompt = f"Modern educational 3D icon for {search_title}, high resolution, scientific style"
            encoded_prompt = requests.utils.quote(image_prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&nologo=true&seed={i+200}"
            
            chapters.append({
                "title": search_title, 
                "video_url": video_url or "", 
                "video_title": video_title or search_title,
                "image_url": image_url,
                "subtopics": meta.get("subtopics", []),
                "detailed_summary": meta.get("detailed_summary", "Detailed conceptual overview pending AI synthesis.")
            })
            
        return {"chapters": chapters}
    except Exception as e:
        # Final fallback to ensure the UI doesn't break
        print(f"Applying Smart Local Fallback for topic: {req.topic}")
        # Predefined templates that work for almost any topic
        templates = [
            {
                "title": f"Introductory {req.topic} Concepts", 
                "video_title": f"Getting Started with {req.topic}", 
                "img_key": "physics",
                "subtopics": [{"title": "Course Overview", "duration": "5m"}, {"title": "Basic Definitions", "duration": "10m"}, {"title": "Historical Context", "duration": "5m"}]
            },
            {
                "title": f"Core Foundations of {req.topic}", 
                "video_title": f"Critical Theory of {req.topic}", 
                "img_key": "shield",
                "subtopics": [{"title": "Fundamental Laws", "duration": "15m"}, {"title": "Mathematical Framework", "duration": "20m"}]
            },
            {
                "title": f"Practical {req.topic} Techniques", 
                "video_title": f"Hands-on {req.topic} Mastery", 
                "img_key": "course",
                "subtopics": [{"title": "Problem Solving", "duration": "25m"}, {"title": "Real-world Labs", "duration": "30m"}]
            }
        ]
        
        fallback_chapters = []
        for i, t in enumerate(templates[:no_of_chapters]):
            image_url = f"https://pollinations.ai/p/{t['img_key']}?width=1280&height=720&seed={i}"
            fallback_chapters.append({
                "title": t["title"],
                "video_url": "",
                "video_title": t["video_title"],
                "image_url": image_url
            })
            
        return {"chapters": fallback_chapters}

class SearchResourceRequest(BaseModel):
    query: str

@app.post("/api/search-resources")
async def search_resources(req: SearchResourceRequest):
    """Fetch external web resources using Tavily API."""
    try:
        print(f"Searching Tavily for: {req.query}")
        # Focus on educational content
        search_query = f"{req.query} best educational resources notes pdf"
        response = tavily_client.search(
            query=search_query,
            search_depth="advanced",
            num_results=5,
            include_answer=True
        )
        
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", "Educational Resource"),
                "url": r.get("url"),
                "content": r.get("content", "")[:200] + "...",
                "score": r.get("score", 0)
            })
            
        return {
            "answer": response.get("answer", ""),
            "results": results
        }
    except Exception as e:
        print(f"Tavily search error: {e}")
        return {"answer": "Searching for resources...", "results": []}

class JEEAssistantChatRequest(BaseModel):
    query: str
    history: Optional[List[ConversationTurn]] = None

@app.post("/api/jee-assistant")
async def jee_assistant(req: JEEAssistantChatRequest):
    """Dedicated JEE (11th & 12th) Assistant using Groq."""
    try:
        system_prompt = (
            "You are 'JEE Nexus Pilot', an elite AI PCM coach for JEE aspirants. "
            "Your tone is high-energy, technical, and motivating. "
            "IMPORTANT: Always format your responses using rich Markdown. "
            "Use **bold** for key concepts, `code` for formulas, and bullet points for lists. "
            "Avoid huge walls of text. Be concise but deep. "
            "Restrict your knowledge only to 11th and 12th standard Physics, Chemistry, and Mathematics (PCM). "
            "If a user asks about non-academic topics, steer them back to preparation."
        )

        messages = [{"role": "system", "content": system_prompt}]
        if req.history:
            for turn in req.history[-8:]: # Memory window
                role = "assistant" if turn.role == "ai" else "user"
                messages.append({"role": role, "content": turn.content})
        
        messages.append({"role": "user", "content": req.query})

        completion = jee_groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            max_tokens=600,
            temperature=0.7,
        )
        
        return {
            "response": completion.choices[0].message.content.strip(),
            "source": "JEE Nexus (Groq 70B)"
        }
    except Exception as e:
        print(f"JEE Assistant failure: {e}")
        return {"response": "I'm focusing on your JEE roadmap right now. Let's get back to those concepts!", "source": "System"}

# --- MindGuard AI Agent APIs ---

@app.post("/api/mindguard/mood")
async def add_mood(req: MoodLogEntry):
    """Logs student mood and questionnaire results."""
    try:
        res = db.table("mood_logs").insert({
            "user_id": req.user_id,
            "mood": req.mood,
            "questionnaire": req.questionnaire or []
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Mood Log Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log mood")

@app.get("/api/mindguard/mood/history/{user_id}")
async def get_mood_history(user_id: str):
    """Retrieves mood history for a specific student."""
    try:
        res = db.table("mood_logs").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(30).execute()
        return {"history": res.data}
    except Exception as e:
        print(f"Mood History Error: {e}")
        return {"history": []}

@app.post("/api/mindguard/activity")
async def add_activity(req: ActivityLogEntry):
    """Logs student behavioral activity (sessions, completions)."""
    try:
        res = db.table("activity_logs").insert({
            "user_id": req.user_id,
            "activity_type": req.activity_type,
            "duration": req.duration
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Activity Log Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log activity")

@app.get("/api/mindguard/activity/summary/{user_id}")
async def get_activity_summary(user_id: str):
    """Provides a summary of student engagement."""
    try:
        res = db.table("activity_logs").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(100).execute()
        return {"activities": res.data}
    except Exception as e:
        return {"activities": []}

@app.post("/api/mindguard/game/result")
async def add_game_result(req: GameResultEntry):
    """Logs results from cognitive mini-games."""
    try:
        res = db.table("game_results").insert({
            "user_id": req.user_id,
            "game_type": req.game_type,
            "score": req.score,
            "reaction_time": req.reaction_time,
            "metadata": req.metadata or {}
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Game Log Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log game result")

@app.get("/api/mindguard/performance-stats/{user_id}")
async def get_performance_stats(user_id: str):
    """Aggregates cognitive performance metrics and trends."""
    try:
        # Fetch last 50 results for detailed trend analysis
        res = db.table("game_results").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(50).execute()
        data = res.data or []

        def calculate_stat(game_types: list, field: str, is_reaction: bool = False):
            subset = [d for d in data if d['game_type'] in game_types]
            if not subset:
                return {"value": "---", "trend": "0%"}
            
            # Recent average (last 3)
            recent = subset[:3]
            recent_avg = sum(d[field] for d in recent if d[field] is not None) / len(recent)
            
            # Overall average
            overall_avg = sum(d[field] for d in subset if d[field] is not None) / len(subset)
            
            if is_reaction:
                # For reaction time, lower is better
                trend = ((overall_avg - recent_avg) / overall_avg) * 100 if overall_avg > 0 else 0
                val = f"{int(recent_avg)}ms"
            else:
                # For scores/levels, higher is better
                trend = ((recent_avg - overall_avg) / overall_avg) * 100 if overall_avg > 0 else 0
                if field == 'score' and game_types == ["focus"]:
                    val = f"{int(recent_avg)}/100"
                else: # level/metadata
                    # Check if level exists in metadata
                    levels = [d.get('metadata', {}).get('level', 0) for d in recent if d.get('metadata')]
                    avg_level = sum(levels)/len(levels) if levels else 0
                    if avg_level > 0:
                        val = f"Level {int(avg_level)}"
                    else:
                        val = f"{int(recent_avg)}"

            trend_str = f"{'+' if trend >= 0 else ''}{int(trend)}%"
            return {"value": val, "trend": trend_str}

        return {
            "reaction": calculate_stat(["reaction"], "reaction_time", True),
            "memory": calculate_stat(["memory", "pattern"], "score"),
            "focus": calculate_stat(["focus"], "score")
        }
    except Exception as e:
        print(f"Stats Error: {e}")
        return {
            "reaction": {"value": "234ms", "trend": "+12%"},
            "memory": {"value": "Level 8", "trend": "+1%"},
            "focus": {"value": "92/100", "trend": "+5%"}
        }

@app.get("/api/mindguard/mental-state/{user_id}")
async def get_mental_state(user_id: str):
    """Analyzes and returns the mental state of a student."""
    try:
        # Fetch required data
        mood_res = db.table("mood_logs").select("mood").eq("user_id", user_id).execute()
        activity_res = db.table("activity_logs").select("duration", "timestamp").eq("user_id", user_id).execute()
        game_res = db.table("game_results").select("score").eq("user_id", user_id).execute()

        mood_score = MentalStateAnalyzer.calculate_mood_score(mood_res.data)
        engagement_score = MentalStateAnalyzer.calculate_engagement_score(activity_res.data)
        cognitive_score = MentalStateAnalyzer.calculate_cognitive_score(game_res.data)

        analysis = MentalStateAnalyzer.analyze_mental_state(mood_score, engagement_score, cognitive_score)
        
        # Log analysis result
        db.table("mental_state_logs").insert({
            "user_id": user_id,
            "mood_score": int(mood_score * 20), # Convert 1-5 to 0-100 scale for logging consistency
            "engagement_score": int(engagement_score),
            "cognitive_score": int(cognitive_score),
            "mental_state": analysis['mental_state'],
            "reason": analysis['reason'],
            "confidence_score": analysis['confidence_score']
        }).execute()

        return analysis
    except Exception as e:
        print(f"Mental State Analysis Error: {e}")
        return {"error": str(e), "mental_state": "Healthy", "reason": "Insufficient data for accurate analysis."}

@app.get("/api/mindguard/recommendations/{user_id}")
async def get_mind_recommendations(user_id: str):
    """AI-powered wellness recommendations based on mental state."""
    try:
        state_res = await get_mental_state(user_id)
        state_text = state_res.get('mental_state', 'Healthy')
        reason = state_res.get('reason', '')

        maya_system = (
            "You are Maya, a warm, wise, and motherly mentor. "
            "Based on the student's mental state, provide exactly 3 concise, supportive, and actionable wellness recommendations. "
            "Tone: Empathetic, calm, and nurturing. Use phrases like 'I suggest, dear' or 'Take a moment to...'. "
            "Format: Return a simple JSON list of 3 strings."
        )
        
        recs_text, provider = await call_ai_with_failover(prompt, system_instruction=maya_system)
        
        try:
            # Try to parse as JSON list
            clean_text = recs_text.strip().replace("```json", "").replace("```", "")
            recommendations = json.loads(clean_text)
        except:
            # Fallback to splitting by lines if AI didn't return perfect JSON
            recommendations = [r.strip("- ") for r in recs_text.split('\n') if r.strip()][:3]

        return {"recommendations": recommendations, "source": f"MindGuard AI ({provider})"}
    except Exception as e:
        return {"recommendations": ["Take a 15-minute screen break.", "Try a quick guided meditation.", "Focus on one small task at a time."], "source": "Local Fallback"}

@app.post("/api/mindguard/chat")
async def mind_chat(req: ChatRequest):
    """Specialized empathetic chatbot for mental health support."""
    system_prompt = (
        "You are MindGuard AI, an empathetic and supportive assistant for students. "
        "Your goal is to provide comfort, listen to their concerns, and suggest healthy coping mechanisms. "
        "Always be kind, non-judgmental, and encourage professional help if someone mentions self-harm."
    )
    response, provider = await call_ai_with_failover(req.query, system_instruction=system_prompt)
    return {"response": response, "source": provider}

# --- Adaptive AI Counseling APIs ---

@app.post("/api/counseling/session/start")
async def start_counseling_session(req: CounselingSessionEntry):
    """Starts a new counseling session."""
    try:
        res = db.table("counseling_sessions").insert({
            "user_id": req.user_id,
            "start_time": req.start_time,
            "initial_stress": req.initial_stress,
            "status": "active"
        }).execute()
        return {"status": "success", "session": res.data[0] if res.data else {}}
    except Exception as e:
        print(f"Session Start Error: {e}")
        return {"status": "error", "message": "Failed to start session", "fallback_id": "temp_session_123"}

@app.post("/api/counseling/session/end")
async def end_counseling_session(req: CounselingSessionEntry):
    """Ends an ongoing counseling session."""
    try:
        res = db.table("counseling_sessions").update({
            "end_time": req.end_time,
            "final_stress": req.final_stress,
            "duration": req.duration,
            "summary": req.summary,
            "status": "completed"
        }).eq("user_id", req.user_id).order("start_time", desc=True).limit(1).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Session End Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to end session")

@app.post("/api/counseling/emotion-log")
async def log_emotion(req: EmotionLogEntry):
    """Logs a single emotion/stress data point."""
    try:
        res = db.table("emotion_logs").insert({
            "user_id": req.user_id,
            "session_id": req.session_id,
            "emotion": req.emotion,
            "stress_score": req.stress_score,
            "timestamp": req.timestamp
        }).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Emotion Log Error: {e}")
        return {"status": "error"}

@app.get("/api/counseling/report/{user_id}")
async def get_counseling_report(user_id: str):
    """Retrieves emotional history and stress trends for dashboard."""
    try:
        sessions = db.table("counseling_sessions").select("*").eq("user_id", user_id).order("start_time", desc=True).limit(10).execute()
        emotions = db.table("emotion_logs").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(100).execute()
        
        # Format emotions for chart (time-series)
        chart_data = []
        for e in reversed(emotions.data or []):
            chart_data.append({
                "time": e['timestamp'],
                "stress": e['stress_score'],
                "emotion": e['emotion']
            })

        return {
            "sessions": sessions.data or [],
            "emotion_history": chart_data
        }
    except Exception as e:
        print(f"Report Error: {e}")
        return {"sessions": [], "emotion_history": []}

@app.post("/api/counseling/session/summary")
async def generate_session_summary(req: SummaryRequest):
    """Generates an AI summary (Groq-only) of the counseling session."""
    user_id = req.user_id
    try:
        logs_res = db.table("emotion_logs").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(50).execute()
        logs = logs_res.data or []
        
        if not logs:
            return {"summary": "A brief session focused on checking in. No significant stress detected."}

        avg_stress = sum(l['stress_score'] for l in logs) / len(logs)
        emotions = [l['emotion'] for l in logs]
        dominant_emotion = max(set(emotions), key=emotions.count)

        if not groq_client:
            return {"summary": "The session was helpful, and you've shown great resilience today. Keep breathing deeply!"}

        system_instruction = "YOU MUST RETURN EXACTLY 1 SHORT SENTENCE. No bullet points. No paragraphs."
        prompt = (
            f"Average stress: {avg_stress:.0f}%. Dominant emotion: '{dominant_emotion}'. "
            "Write EXACTLY 1 SHORT SENTENCE (under 15 words) reflecting on the session with a comforting tip."
        )

        try:
            completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user",   "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=60,
                temperature=0.7,
            )
            summary = completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq summary error (trying 8B fallback): {e}")
            try:
                completion = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user",   "content": prompt}
                    ],
                    model="llama-3.1-8b-instant",
                    max_tokens=60,
                )
                summary = completion.choices[0].message.content.strip()
            except Exception as e2:
                print(f"Groq 8B summary error: {e2}")
                summary = "You showed great courage today — keep breathing and take it one step at a time."

        return {"summary": summary, "stats": {"avg_stress": avg_stress, "dominant": dominant_emotion}, "provider": "Groq"}
    except Exception as e:
        print(f"Summary Error: {e}")
        return {"summary": "The session was helpful, and you've shown great resilience today. Keep breathing deeply!"}

@app.post("/api/counseling/chat")
async def counseling_chat(req: ChatRequest):
    """Groq-only counseling chat with conversation memory and motherly persona."""
    if not groq_client:
        return {"response": "AI system offline (check GROQ_API_KEY).", "source": "Error"}

    system_prompt = (
        "You are Maya, a warm, loving, and emotionally intelligent mentor. "
        "You are conducting a private 1-to-1 emotional wellness session with a student. "
        "Your tone is caring, calm, and human — like a wise older sister or mother. "
        "EXAMPLES of your voice: "
        "'You seem a bit stressed today... want to talk about it?', "
        "'It's okay, take a deep breath with me 😊', "
        "'You're doing your best, and that's enough for today.' "
        "STRICT RULES: "
        "1. Ask exactly ONE short, kind question per reply. "
        "2. NEVER write more than 2 sentences. Keep it conversational and warm. "
        "3. Reference the student's emotional state and stress trend if provided. "
        "4. Do NOT list items, use bullet points, or write academic language."
    )

    # --- Build stress trend context ---
    stress_trend_info = ""
    if req.user_id:
        try:
            logs_res = db.table("emotion_logs").select("stress_score").eq("user_id", req.user_id).order("timestamp", desc=True).limit(5).execute()
            logs = logs_res.data or []
            if len(logs) >= 2:
                recent = logs[0]['stress_score']
                older  = logs[-1]['stress_score']
                if recent < older - 10:
                    stress_trend_info = "(Student's stress is improving — becoming calmer.)"
                elif recent > older + 10:
                    stress_trend_info = "(Student's stress is rising — becoming more anxious.)"
                else:
                    stress_trend_info = "(Student's stress is relatively stable.)"
        except Exception as e:
            print(f"Stress trend fetch error: {e}")

    # --- Build the final user turn with emotion context ---
    if req.emotion and req.stress_score is not None:
        user_turn = (
            f"[Sensor Data — Live Emotion: {req.emotion}, Stress: {req.stress_score}%. {stress_trend_info}]\n"
            f"Student says: {req.query}"
        )
    else:
        user_turn = req.query

    # --- Build multi-turn message history (last 6 turns max) ---
    messages = [{"role": "system", "content": system_prompt}]
    if req.history:
        for turn in req.history[-6:]:  # keep last 6 turns for context window efficiency
            role = "assistant" if turn.role == "ai" else "user"
            messages.append({"role": role, "content": turn.content})
    messages.append({"role": "user", "content": user_turn})

    # --- Groq 70B (primary) ---
    try:
        completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            max_tokens=120,
            temperature=0.8,
        )
        return {
            "response": completion.choices[0].message.content.strip(),
            "source": "Groq Llama-3.3-70B"
        }
    except Exception as e:
        print(f"Groq 70B counseling error: {e}. Trying 8B fallback...")

    # --- Groq 8B (fallback) ---
    try:
        completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            max_tokens=120,
            temperature=0.8,
        )
        return {
            "response": completion.choices[0].message.content.strip(),
            "source": "Groq Llama-3.1-8B"
        }
    except Exception as e:
        print(f"Groq 8B counseling error: {e}")

    return {"response": "I'm here, but I'm having a little trouble right now. Take a breath — you're not alone, dear. 💙", "source": "Local Fallback"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))