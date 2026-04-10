# LearnSphere AI | Personalized Learning Platform

![LearnSphere AI Hub](https://github.com/user-attachments/assets/076fe6bb-b53e-4eb9-9f74-d2b4a0cb8791)

## 🌟 Overview

**LearnSphere AI** is a cutting-edge, production-ready educational ecosystem designed to provide hyper-personalized learning experiences. By merging advanced AI generation (Gemini + Groq) with a high-performance Bento Hub UI, the platform creates customized courses, provides real-time AI tutoring, and monitors student wellbeing to prevent burnout.

### 🎥 Project Demo
> [!TIP]
> **View the full system walkthrough here:**
> [Final UX Verification & Walkthrough](https://github.com/Krishagram/LearnSphere/blob/main/docs/demo_walkthrough.md) (Placeholder for your recording)

---

## 🚀 Key Features

1.  **AI Course Architect**: Instantly generate structured learning paths with AI-curated YouTube content and unique AI-generated thumbnails for every phase.
2.  **Zero-Latency AI Tutor**: A dual-model failover system (Gemini 2.0 + Groq Llama-3) ensures your personal tutor is always online and incredibly fast.
3.  **Wellbeing Radar**: AI sentiment analysis that analyzes student feedback to identify burnout risks and provide dedicated academic support.
4.  **Bento Hub UI**: A stunning, premium dashboard built with glassmorphism and smooth animations for a distraction-free learning experience.
5.  **Smart RAG (Pinecone)**: Preparation for high-scale context-aware learning using cloud-native vector search.

---

## 🛠️ Tech Stack

-   **Frontend**: Next.js 16.2.3 (App Router), TypeScript, Tailwind CSS v4, Framer Motion.
-   **Backend**: FastAPI (Python 3.11), Uvicorn.
-   **AI Hub**: Google Gemini 2.0 Flash, Groq (Llama-3), Pollinations.ai (Generative Images).
-   **Database/Auth**: Supabase (PostgreSQL + Auth).
-   **Vector Search**: Pinecone (Infrastructure Ready).

---

## 📦 Startup & Installation

### 1. Prerequisites
-   Node.js 20+
-   Python 3.11+
-   Supabase Account (URL & Anon Key)
-   Google AI Studio API Key (Gemini)
-   (Optional) Groq API Key for faster chat fallback.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```
**Configure `.env`**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMMA_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key_here
YOUTUBE_API_KEY=your_youtube_v3_key
PORT=8001
```
**Run**: `python main.py`

### 3. Frontend Setup
```bash
cd frontend
npm install
```
**Configure `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8001
```
**Run**: `npm run dev`

---

## 🎯 Usage
-   **Dashboard**: `http://localhost:3000/dashboard`
-   **AI Tutor**: Access real-time support in the Chat tab.
-   **Course Hub**: Enter any topic to generate a full curriculum with visual aids.
-   **Wellbeing**: Get an AI report on your mental and academic health.

## 📄 License
This project is licensed under the MIT License.
