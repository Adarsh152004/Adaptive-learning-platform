import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

def connection():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("[ERROR] MONGO_URI not found in environment variables!")
        return None
        
    try:
        # Use the fully qualified name from the import
        client = pymongo.MongoClient(mongo_uri)
        # Verify connection
        client.admin.command('ping')
        print("[SUCCESS] MongoDB Connected Successfully")
        return client['PLP']
    except Exception as e:
        print(f"[ERROR] MongoDB Connection Error: {e}")
        return None
