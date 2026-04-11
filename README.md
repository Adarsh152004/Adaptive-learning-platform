# 🚀 JEE Smart Suite | AI-Powered Learning Trajectory

JEE Smart Suite is a professional, high-density learning platform designed specifically for JEE (Joint Entrance Examination) aspirants. It combines **Discovery-based Roadmaps**, **Mastery Synthesis**, and an **Industrial-Grade PCM Assistant** to provide an elite, distraction-free studying environment.

---

## ✨ Key Features

### 🛤️ Learning Trajectory (Flow Engine)
- **Static Core Roadmap**: Visualize any JEE topic as a high-fidelity, vertical flowchart.
- **Mastery Intelligence**: Get a synthesized AI summary of topic significance and exam patterns.
- **Knowledge Nodes**: Real-time academic resource links fetched from the web (PDFs, Notes, University docs).
- **Whiteboard Aesthetic**: Conceptual visuals for each chapter to maintain a classroom-board focus.

### 🤖 JEE Nexus Pilot (Chatbot)
- **Industrial Interface**: ChatGPT-style message parsing with high-end typography.
- **Markdown Support**: Rich formatting for bold terms, lists, and **LaTeX-formatted formulas**.
- **PCM Specialization**: Motivated, technical assistant focused strictly on Physics, Chemistry, and Mathematics.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide Icons](https://lucide.dev/).
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/).
- **AI Intelligence**: [Groq Llama-3](https://groq.com/), [Google Gemini Flash 1.5](https://aistudio.google.com/).
- **Web Search**: [Tavily AI](https://tavily.com/).
- **Video Discovery**: [YouTube Data API v3](https://developers.google.com/youtube/v3).
- **Database**: [Supabase](https://supabase.com/) & [Pinecone](https://www.pinecone.io/) (Vector Search).

---

## 🏁 Direct Setup Instructions (Windows)

### 1. 📂 Clone & Environment Setup
```powershell
# Clone the repository
git clone <your-repo-url>
cd Adaptive-learning-platform

# Create root .env from template
cp .env.example backend/.env
# Update backend/.env with your actual API keys (Groq, Tavily, etc.)
```

### 2. 🐍 Backend Setup (FastAPI)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:8001`*

### 3. ⚛️ Frontend Setup (Next.js)
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🔑 Required API Keys

To unlock the full potential of the Suite, ensure the following keys are set in your `.env`:
- **GROQ_API_KEY**: Powers the Nexus Pilot & Roadmap Synthesis.
- **TAVILY_API_KEY**: Enables the Live Web Discovery engine.
- **YOUTUBE_API_KEY**: Fetches relevant educational video assets.
- **SUPABASE_URL/KEY**: Handles user data and PCM content storage.

---

## 📝 License
Proprietary for educational usage within the JEE Smart Suite ecosystem.

---
**Drafted with ❤️ by the Advanced Agentic Coding Team.**
