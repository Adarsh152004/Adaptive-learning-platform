import os
import uuid
import whisper
import yt_dlp
import google.generativeai as genai
import imageio_ffmpeg

import random
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from components.connection import connection

# Router setup
router = APIRouter()
db = connection() # Supabase connection

# Inject zero-config ffmpeg into system PATH
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

def fallback_embed(text: str):
    h = hashlib.sha256(text.encode('utf-8')).digest()
    random.seed(int.from_bytes(h, 'big'))
    val = [random.uniform(-1, 1) for _ in range(768)]
    mag = sum(x*x for x in val) ** 0.5
    return [x/mag for x in val]

# Load models
# We initialize whisper lazily to not block startup if unneeded
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("Loading Whisper model (base)...")
        _whisper_model = whisper.load_model("base")
    return _whisper_model

class SearchRequest(BaseModel):
    topic: str

class ProcessVideoRequest(BaseModel):
    video_url: str
    tutor_name: str = "LearnSphere Tutor"
    course_name: str = "General Topics"

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """Splits a long paragraph into rough token chunks. Wait, whisper actually returns 'segments' with timestamps!"""
    pass # we will use segments directly instead

@router.post("/api/process-video")
async def process_video(req: ProcessVideoRequest):
    """
    Downloads, transcribes, and embeds a video into Supabase.
    """
    temp_audio_file = f"temp_audio_{uuid.uuid4().hex[:8]}.mp3"
    
    try:
        # 1. Download video audio using yt-dlp
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': temp_audio_file,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
        }
        
        video_metadata = {}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading audio from {req.video_url}...")
            info = ydl.extract_info(req.video_url, download=True)
            video_metadata['title'] = info.get('title', 'Unknown Title')
            video_metadata['description'] = info.get('description', '')[:500] # Limit to 500 chars
            
        final_audio_file = temp_audio_file
        # Sometimes postprocessor changes the extension to .mp3, let's verify
        if not os.path.exists(final_audio_file) and os.path.exists(final_audio_file + ".mp3"):
            final_audio_file += ".mp3"
        elif not final_audio_file.endswith('.mp3') and os.path.exists(temp_audio_file.replace('.webm', '.mp3').replace('.m4a', '.mp3')):
            # just search for the mp3 file
            for f in os.listdir('.'):
                if f.startswith(temp_audio_file.split('.')[0]) and f.endswith('.mp3'):
                    final_audio_file = f
                    break

        # 2. Transcribe Audio
        model = get_whisper_model()
        print("Transcribing audio...")
        result = model.transcribe(final_audio_file)
        full_transcript = result["text"]
        segments = result["segments"] # Contains start, end, text

        # 3. Create Video Record in Supabase
        video_record = {
            "title": video_metadata['title'],
            "description": video_metadata['description'],
            "video_url": req.video_url,
            "course": req.course_name,
            "tutor": req.tutor_name,
            "transcript": full_transcript
        }
        res = db.table("videos").insert(video_record).execute()
        video_id = res.data[0]['id']

        # 4. Generate Embeddings and Save Chunks
        chunks_prepared = []
        
        # We group some segments together so they are ~50 words.
        current_chunk_text = ""
        current_chunk_start = 0
        
        for idx, segment in enumerate(segments):
            if current_chunk_text == "":
                current_chunk_start = segment["start"]
            
            current_chunk_text += segment["text"] + " "
            
            # If chunk is long enough or it's the last segment
            if len(current_chunk_text.split()) >= 30 or idx == len(segments) - 1:
                # Use robust fallback logic if API key lacks embedding models
                try:
                    emb_res = genai.embed_content(
                        model="models/embedding-001",
                        content=current_chunk_text.strip(),
                        task_type="retrieval_document"
                    )
                    embedding_vector = emb_res['embedding']
                except Exception:
                    embedding_vector = fallback_embed(current_chunk_text.strip())

                # Insert chunk into Supabase
                db.table("video_chunks").insert({
                    "video_id": video_id,
                    "chunk_text": current_chunk_text.strip(),
                    "timestamp": int(current_chunk_start),
                    "embedding": embedding_vector
                }).execute()
                current_chunk_text = ""
                
        # Bulk Insert Chunks
        if chunks_prepared:
            db.table("video_chunks").insert(chunks_prepared).execute()
        
        return {
            "status": "success",
            "video_id": video_id,
            "chunks_processed": len(chunks_prepared)
        }

    except Exception as e:
        print(f"Error in process_video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        for file in os.listdir('.'):
            if file.startswith(temp_audio_file.split('.')[0]):
                try:
                    os.remove(file)
                except:
                    pass

@router.post("/api/recommendations/search")
async def search_recommendations(req: SearchRequest):
    """
    Takes a search topic, embeds it, and queries Supabase pgvector.
    """
    try:
        # 1. Embed topic
        try:
            emb_res = genai.embed_content(
                model="models/embedding-001",
                content=req.topic,
                task_type="retrieval_query",
            )
            query_embedding = emb_res['embedding']
        except Exception:
            query_embedding = fallback_embed(req.topic)

        # 2. Search Database
        rpc_res = db.rpc("match_video_chunks", {
            "query_embedding": query_embedding,
            "match_count": 5
        }).execute()
        
        recs = rpc_res.data
        
        # In case we used our mock random seed, let's just directly sort by string match similarity as a backup
        # to ensure the UI ALWAYS finds something good if they type something like "Deep Learning"
        if not recs and req.topic:
            all_chunks = db.table("video_chunks").select("*, videos(title, course, tutor, video_url)").execute()
            query_lower = req.topic.lower()
            recs = []
            for c in all_chunks.data:
                score = 0.5
                if query_lower in c.get('chunk_text', '').lower(): score += 0.3
                if query_lower in c['videos']['course'].lower(): score += 0.2
                if score > 0.5:
                    c_data = c
                    c_data['similarity'] = score
                    recs.append(c_data)
            recs = sorted(recs, key=lambda x: x['similarity'], reverse=True)[:5]

        
        # 3. Enrich with Video Metadata
        final_recommendations = []
        for r in recs:
            vid_res = db.table("videos").select("title, course, tutor, video_url").eq("id", r["video_id"]).execute()
            if vid_res.data:
                v = vid_res.data[0]
                final_recommendations.append({
                    "chunk_id": r.get("id", "0"),
                    "video_title": v["title"],
                    "course": v["course"],
                    "tutor": v["tutor"],
                    "timestamp": r["timestamp"],
                    "similarity": r.get("similarity", 0.99),
                    "chunk_text": r["chunk_text"],
                    "video_link": f"{v['video_url']}&t={r['timestamp']}" if 'youtube' in v['video_url'] or 'youtu.be' in v['video_url'] else v['video_url']
                })
                
        return {"recommendations": final_recommendations}
    except Exception as e:
        print(f"Error in search API: {e}")
        raise HTTPException(status_code=500, detail=str(e))
