import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

print(f"Testing Pinecone with Key: {api_key[:10]}... and Index: {index_name}")

try:
    pc = Pinecone(api_key=api_key)
    print("Connection Object Created.")
    indexes = pc.list_indexes()
    print(f"Indexes found: {indexes.names()}")
except Exception as e:
    print(f"Connection Failed: {e}")
