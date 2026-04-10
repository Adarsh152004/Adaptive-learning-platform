import os
import uuid
import hashlib
import random
from components.connection import connection

db = connection()

videos = [
    {
        "url": "https://www.youtube.com/watch?v=aircAruvnKk",
        "title": "But what is a neural network? | Chapter 1, Deep learning",
        "description": "What are the core components of a neural network?",
        "course": "Deep Learning",
        "tutor": "3Blue1Brown",
        "transcript": "A neural network is a machine learning model inspired by the human brain. It consists of layers of interconnected nodes or neurons. Each connection has a weight, and learning involves adjusting these weights based on data. The most common type is a feedforward network. We use backpropagation and gradient descent to train it.",
        "chunks": [
            {
                "timestamp": 12,
                "text": "A neural network is a machine learning model inspired by the human brain. It consists of layers of interconnected nodes or neurons."
            },
            {
                "timestamp": 45,
                "text": "Each connection has a weight, and learning involves adjusting these weights based on data. We use backpropagation and gradient descent."
            }
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        "title": "Large Language Models Explained",
        "description": "How do LLMs actually function?",
        "course": "Generative AI",
        "tutor": "Andrej Karpathy",
        "transcript": "Large Language Models are massive neural networks trained on gigantic web datasets. They function fundamentally by predicting the next token in a sequence context. The core architecture used today is the Transformer, introduced by Google in 2017. Attention is all you need.",
        "chunks": [
            {
                "timestamp": 5,
                "text": "Large Language Models are massive neural networks trained on gigantic web datasets. They function fundamentally by predicting the next token in a sequence."
            },
            {
                "timestamp": 120,
                "text": "The core architecture used today is the Transformer, introduced by Google in 2017. It uses self-attention mechanisms to understand context."
            }
        ]
    },
    {
        "url": "https://www.youtube.com/watch?v=JhHMJCUmq28",
        "title": "Quantum Computers, Explained",
        "description": "A brief overview of quantum computing.",
        "course": "Quantum Mechanics",
        "tutor": "Kurzgesagt",
        "transcript": "Unlike classical computers that use bits of 0 and 1, quantum computers use qubits. Qubits can exist in a superposition of states, allowing them to perform massive numbers of calculations simultaneously. They are particularly good for cryptography and molecular simulation.",
        "chunks": [
            {
                "timestamp": 20,
                "text": "Unlike classical computers that use bits of 0 and 1, quantum computers use qubits. Qubits can exist in a superposition of states."
            },
            {
                "timestamp": 150,
                "text": "This allows them to perform massive numbers of calculations simultaneously. They are particularly good for cryptography and breaking RSA encryption."
            }
        ]
    }
]

print("Starting Mock Seed Injection...")
for v in videos:
    print(f"Injecting {v['title']}...")
    
    # Insert Video
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
    
    def fallback_embed(text: str):
        # Deterministic 768-d vector
        h = hashlib.sha256(text.encode('utf-8')).digest()
        random.seed(int.from_bytes(h, 'big'))
        val = [random.uniform(-1, 1) for _ in range(768)]
        mag = sum(x*x for x in val) ** 0.5
        return [x/mag for x in val]

    for chunk in v["chunks"]:
        emb_list = fallback_embed(chunk["text"])
        
        chunk_inserts.append({
            "video_id": video_id,
            "chunk_text": chunk["text"],
            "timestamp": chunk["timestamp"],
            "embedding": emb_list
        })

        
    db.table("video_chunks").insert(chunk_inserts).execute()

print("Database fully seeded with Mock Videos!")
