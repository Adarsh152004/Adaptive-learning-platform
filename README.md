# LearnSphere AI | Personalized Learning Platform

![LearnSphere AI](https://github.com/user-attachments/assets/076fe6bb-b53e-4eb9-9f74-d2b4a0cb8791)

## Overview

**LearnSphere AI** is an advanced, production-ready educational platform that provides learners with customized educational paths tailored to their unique skills, progress, and learning goals. By leveraging the latest AI models, the platform generates personalized learning plans, course recommendations, and continuous wellbeing monitoring.

## 🚀 Key Features

1.  **AI Tutor (Chat)**: A context-aware learning assistant powered by Gemini 2.0 Flash with RAG-enhanced query resolution.
2.  **Course Architect**: Instantly generate structured learning paths with curated video content from high-quality sources.
3.  **Wellbeing & Risk Analysis**: AI sentiment analysis to monitor student burnout and provide personalized academic support.
4.  **Student Performance Predictor**: ML-based risk assessment to identify potential failure early based on engagement and performance metrics.
5.  **Premium Dashboard**: A stunning, modern interface built with Next.js 16 and Tailwind CSS v4 featuring glassmorphism and smooth animations.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 16.2.3 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion.
-   **Backend**: FastAPI, Python 3.11+, Pydantic.
-   **AI/ML**: Gemini 2.0 Flash (Google AI Studio), Scikit-Learn (Failure Prediction).
-   **Database**: MongoDB Atlas (Cloud NoSQL).
-   **Authentication**: NextAuth.js with JWT integration.

## 📦 Setup & Installation

### Prerequisites
-   Node.js 18+
-   Python 3.11+
-   MongoDB Atlas Cluster
-   Google AI Studio API Key

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure `.env` file:
    ```env
    MONGO_URI=your_mongodb_atlas_uri
    GEMMA_API_KEY=your_google_ai_studio_api_key
    JWT_SECRET=your_jwt_secret
    YOUTUBE_API_KEY=your_youtube_v3_api_key
    PORT=8001
    ```
5.  Run the backend:
    ```bash
    python main.py
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env.local`:
    ```env
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    NEXT_PUBLIC_API_URL=http://localhost:8001
    ```
4.  Run the frontend:
    ```bash
    npm run dev
    ```

## 🎯 Usage
-   Access the frontend at `http://localhost:3000`.
-   API Documentation (Swagger) is available at `http://localhost:8001/docs`.

## 📄 License
This project is licensed under the MIT License.
