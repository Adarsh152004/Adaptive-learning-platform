from components.connection import connection
import os

def migrate():
    db = connection()
    if not db:
        print("Failed to connect to Supabase")
        return

    sql = """
    -- Mood Logs Table
    CREATE TABLE IF NOT EXISTS public.mood_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        mood INTEGER NOT NULL,
        questionnaire JSONB DEFAULT '[]'::jsonb,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- Activity Logs Table
    CREATE TABLE IF NOT EXISTS public.activity_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- Game Results Table
    CREATE TABLE IF NOT EXISTS public.game_results (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        reaction_time FLOAT,
        metadata JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- Check if metadata column exists, if not add it (for existing tables)
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_results' AND column_name='metadata') THEN
            ALTER TABLE public.game_results ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        END IF;
    END $$;

    -- Mental State Logs Table
    CREATE TABLE IF NOT EXISTS public.mental_state_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        mood_score INTEGER,
        engagement_score INTEGER,
        cognitive_score INTEGER,
        mental_state TEXT,
        reason TEXT,
        confidence_score FLOAT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- Counseling Sessions Table
    CREATE TABLE IF NOT EXISTS public.counseling_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_time TIMESTAMPTZ DEFAULT NOW(),
        end_time TIMESTAMPTZ,
        initial_stress FLOAT,
        final_stress FLOAT,
        duration INTEGER,
        summary TEXT,
        status TEXT DEFAULT 'active'
    );

    -- Emotion Logs Table
    CREATE TABLE IF NOT EXISTS public.emotion_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id UUID REFERENCES public.counseling_sessions(id),
        emotion TEXT,
        stress_score FLOAT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    """
    
    # Supabase Python client doesn't have a direct 'execute raw sql' method easily accessible via the community client in all versions
    # But we can use the RPC or hit the API if configured.
    # Alternatively, we can assume the user will run this in their Supabase SQL editor.
    # However, I will try to use the 'db.postgrest.rpc' if possible, but that requires a custom function.
    
    print("Migration SQL generated. Please run this in your Supabase SQL Editor:")
    print(sql)

if __name__ == "__main__":
    migrate()
