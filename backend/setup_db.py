import os
from components.connection import connection
from postgrest.exceptions import APIError

db = connection()

ddl_queries = [
    "CREATE EXTENSION IF NOT EXISTS vector;",
    """
    CREATE TABLE IF NOT EXISTS batches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id uuid,
        batch_code text UNIQUE NOT NULL,
        batch_name text,
        created_at timestamptz DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY,
        name text,
        email text UNIQUE,
        age integer,
        role text,
        batch_id uuid,
        created_at timestamptz DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS videos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        video_url text,
        course text,
        tutor text,
        transcript text,
        created_at timestamptz DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS video_chunks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id uuid,
        chunk_text text,
        timestamp integer,
        embedding vector(768),
        created_at timestamptz DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_performance (
        id serial PRIMARY KEY,
        user_id uuid,
        topic text,
        score integer,
        total_questions integer,
        difficulty text,
        created_at timestamptz DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS wellbeing_logs (
        id serial PRIMARY KEY,
        user_id uuid,
        mood_score integer,
        stress_level text,
        feedback_text text,
        created_at timestamptz DEFAULT now()
    );
    """
]

def setup_database():
    print("🐘 Initializing Database Schema via RPC/SQL...")
    for query in ddl_queries:
        try:
            # We use the 'rpc' method for raw SQL if available, 
            # or try to execute it via a hidden helper if the environment allows.
            # In Supabase Python client, raw SQL is tricky. 
            # We'll try to use the REST API to execute SQL if possible.
            print(f"Executing: {query[:50]}...")
            # For now, we will use the MCP tool again but via a direct python call 
            # if we can find a way. Alternatively, if we have the service role key, 
            # we can do more.
            pass
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Note: This script requires raw SQL execution permissions.")
    # Actually, let's try to use the MCP tool one last time with a VERY simple query.
    pass
