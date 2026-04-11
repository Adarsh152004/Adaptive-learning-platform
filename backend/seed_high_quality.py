import os
import uuid
import hashlib
import random
from components.connection import connection

db = connection()

# Dedicated JEE Content
jee_videos = [
    {
        "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY", # Placeholder URL, real logic uses text match
        "title": "Rotational Mechanics: Moment of Inertia",
        "tutor": "JEE Expert Physics",
        "course": "JEE Physics (11th)",
        "description": "Understanding the mass distribution and its effect on rotation.",
        "transcript": "Moment of inertia measures an object's resistance to rotational acceleration. It depends on mass distribution relative to the axis of rotation.",
        "chunks": [
            {"t": 10, "text": "Moment of inertia is the rotational equivalent of mass in linear motion."},
            {"t": 150, "text": "For a point mass, I equals m times r squared, where r is distance from the axis."},
            {"t": 420, "text": "The Parallel Axis Theorem allows us to find I about any axis if we know I about the center of mass."},
            {"t": 780, "text": "Rolling motion combines pure translation and pure rotation, needing careful energy conservation."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=SccSCuHhOw0",
        "title": "Organic Chemistry: SN1 vs SN2 Mechanisms",
        "tutor": "Chemistry Master",
        "course": "JEE Chemistry (12th)",
        "description": "Nucleophilic substitution mechanisms and kinetics.",
        "transcript": "SN1 is a two-step process involving a carbocation intermediate. SN2 is a single-step concerted process with inversion of configuration.",
        "chunks": [
            {"t": 20, "text": "Nucleophilic substitution reactions are fundamental to organic transformations."},
            {"t": 180, "text": "SN1 reactions follow first-order kinetics and are favored by bulky, polar protic solvents."},
            {"t": 340, "text": "SN2 reactions involve a backside attack, leading to the famous Walden Inversion."},
            {"t": 560, "text": "Steric hindrance is the most critical factor favoring SN1 over SN2 in tertiary halides."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=d_UuCbo8Xbg",
        "title": "Mathematics: Definite Integration & Area Under Curve",
        "tutor": "Math Guru",
        "course": "JEE Mathematics (12th)",
        "description": "Calculus techniques for area calculation.",
        "transcript": "Integration allows us to find the area under any continuous curve. The fundamental theorem of calculus connects differentiation and integration.",
        "chunks": [
            {"t": 45, "text": "The definite integral from a to b represents the net area between the curve and the x-axis."},
            {"t": 210, "text": "Integration by parts is essential for products of algebraic and transcendental functions."},
            {"t": 450, "text": "To find the area between two curves, we integrate the difference between the upper and lower functions."},
            {"t": 820, "text": "Properties of definite integrals, like King's Property, are vital shortcuts for JEE problems."}
        ]
    }
]

def fallback_embed(text: str):
    h = hashlib.sha256(text.encode('utf-8')).digest()
    random.seed(int.from_bytes(h, 'big'))
    val = [random.uniform(-1, 1) for _ in range(768)]
    mag = sum(x*x for x in val) ** 0.5
    return [x/mag for x in val]

print("Injecting High-Quality JEE Knowledge...")

for v in jee_videos:
    try:
        print(f"Feeding: {v['title']}...")
        vid_res = db.table("videos").insert({
            "title": v["title"],
            "description": v["description"],
            "video_url": v["url"],
            "course": v["course"],
            "tutor": v["tutor"],
            "transcript": v["transcript"]
        }).execute()
        
        if not vid_res.data:
            print(f"Skipping {v['title']} - no data returned.")
            continue

        video_id = vid_res.data[0]["id"]
        
        chunk_inserts = []
        for chunk in v["chunks"]:
            chunk_inserts.append({
                "video_id": video_id,
                "chunk_text": chunk["text"],
                "timestamp": chunk["t"],
                "embedding": fallback_embed(chunk["text"])
            })
            
        db.table("video_chunks").insert(chunk_inserts).execute()
        print(f"SUCCESS: {v['title']} processed with {len(v['chunks'])} unique JEE moments.")
    except Exception as e:
        print(f"Error feeding {v['title']}: {e}")

print("JEE Knowledge Seed Complete!")
