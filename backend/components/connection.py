from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found in environment variables!")
        return None
        
    try:
        supabase: Client = create_client(url, key)
        print("[SUCCESS] Supabase Client Initialized Successfully")
        return supabase
    except Exception as e:
        print(f"[ERROR] Supabase Connection Error: {e}")
        return None
