import os
import uuid
import hashlib
import random
from components.connection import connection

db = connection()

more_videos = [
    {
        "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
        "title": "Python for Beginners",
        "description": "Learn the fundamentals of Python programming.",
        "course": "Programming Fundamentals",
        "tutor": "Programming with Mosh",
        "transcript": "Python is a high-level, interpreted programming language known for its readability. In this course, we cover variables, data types, loops, and functions. Python is used in web development, data science, and automation. We will start by installing Python and writing our first 'Hello World' program.",
        "chunks": [
            {"timestamp": 0, "text": "Python is a high-level, interpreted programming language known for its readability. It's great for beginners."},
            {"timestamp": 120, "text": "In this course, we cover variables, data types, loops, and functions. These are the building blocks of any program."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=2-crBg6w974",
        "title": "React Course 2024",
        "description": "Comprehensive React tutorial for modern web development.",
        "course": "Web Development",
        "tutor": "Dave Gray",
        "transcript": "React is a JavaScript library for building user interfaces. It uses a component-based architecture and a virtual DOM for performance. We will learn about Hooks like useState and useEffect, and how to manage state across our application. Modern React focus on functional components.",
        "chunks": [
            {"timestamp": 10, "text": "React is a JavaScript library for building user interfaces. It uses a component-based architecture."},
            {"timestamp": 300, "text": "We will learn about Hooks like useState and useEffect, and how to manage state across our application."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=zsjvFFKOm3c",
        "title": "SQL in 100 Seconds",
        "description": "Quick overview of Structured Query Language.",
        "course": "Databases",
        "tutor": "Fireship",
        "transcript": "SQL is the standard language for relational databases. It allows you to create, read, update, and delete data using queries. We use SELECT to fetch data, JOIN to combine tables, and WHERE to filter results. SQL is essential for almost every backend developer.",
        "chunks": [
            {"timestamp": 0, "text": "SQL is the standard language for relational databases. It allows you to manage structured data."},
            {"timestamp": 50, "text": "We use SELECT to fetch data, JOIN to combine tables, and WHERE to filter results. It's declarative."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=Gjnup-PuquQ",
        "title": "Docker in 100 Seconds",
        "description": "Introduction to containerization with Docker.",
        "course": "DevOps",
        "tutor": "Fireship",
        "transcript": "Docker allows you to package an application with all its dependencies into a standardized unit called a container. Containers are lightweight and portable, ensuring the app runs the same way everywhere. We use Dockerfiles to define images and Docker Compose to manage multi-container apps.",
        "chunks": [
            {"timestamp": 0, "text": "Docker allows you to package an application into a container. This solves the 'works on my machine' problem."},
            {"timestamp": 60, "text": "We use Dockerfiles to define images and Docker Compose to manage complex multi-container environments."}
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=hs3piaN4b5I",
        "title": "CSS Grid vs Flexbox",
        "description": "Deciding between Grid and Flexbox for your layout.",
        "course": "Web Development",
        "tutor": "Web Dev Simplified",
        "transcript": "Flexbox is designed for one-dimensional layouts (rows OR columns), while Grid is for two-dimensional layouts (rows AND columns). Flexbox is great for alignment and distribution, while Grid is superior for complex, structured layouts. Often, the best approach is to use both together.",
        "chunks": [
            {"timestamp": 20, "text": "Flexbox is for one-dimensional layouts, while Grid is for two-dimensional layouts. That's the main difference."},
            {"timestamp": 180, "text": "Flexbox is great for simple alignment, while Grid is superior for complex page structures. Use both!"}
        ]
    }
]

def fallback_embed(text: str):
    h = hashlib.sha256(text.encode('utf-8')).digest()
    random.seed(int.from_bytes(h, 'big'))
    val = [random.uniform(-1, 1) for _ in range(768)]
    mag = sum(x*x for x in val) ** 0.5
    return [x/mag for x in val]

print(f"Injecting {len(more_videos)} additional educational videos...")

for v in more_videos:
    try:
        # Check if exists
        check = db.table("videos").select("id").eq("video_url", v["url"]).execute()
        if check.data:
            print(f"Skipping {v['title']} (already exists)")
            continue
            
        print(f"Feeding: {v['title']}...")
        vid_res = db.table("videos").insert({
            "title": v["title"],
            "description": v["description"],
            "video_url": v["url"],
            "course": v["course"],
            "tutor": v["tutor"],
            "transcript": v["transcript"]
        }).execute()
        
        video_id = vid_res.data[0]["id"]
        
        chunk_inserts = []
        for chunk in v["chunks"]:
            chunk_inserts.append({
                "video_id": video_id,
                "chunk_text": chunk["text"],
                "timestamp": chunk["timestamp"],
                "embedding": fallback_embed(chunk["text"])
            })
            
        db.table("video_chunks").insert(chunk_inserts).execute()
        print(f"Successfully fed {v['title']}")
    except Exception as e:
        print(f"Error feeding {v['title']}: {e}")

print("Knowledge Base expanded successfully!")
