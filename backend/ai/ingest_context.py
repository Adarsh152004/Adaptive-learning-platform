import os
import glob
import sys
from pinecone_service import pinecone_store
from google.generativeai import embed_content
from dotenv import load_dotenv

load_dotenv()

# Directories to index
INCLUDE_EXTENSIONS = ('.py', '.tsx', '.ts', '.css', '.md', '.sql')
EXCLUDE_DIRS = ('venv', '.git', '.next', 'node_modules', '__pycache__', 'assets')

def chunk_content(content, chunk_size=1500):
    """Simple character-based chunking for code and documentation."""
    return [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)]

def ingest_application_context():
    print("Starting Application Context Ingestion into Pinecone...")
    sys.stdout.flush()
    
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    indexed_files = 0
    
    for root, dirs, files in os.walk(workspace_root):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file.endswith(INCLUDE_EXTENSIONS):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, workspace_root)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    if not content.strip():
                        continue
                        
                    chunks = chunk_content(content)
                    print(f"Indexing: {rel_path} ({len(chunks)} chunks)")
                    sys.stdout.flush()
                    
                    for i, chunk in enumerate(chunks):
                        doc_id = f"{rel_path}_chunk_{i}"
                        metadata = {
                            "path": rel_path,
                            "filename": file,
                            "text": chunk, # Store actual text for LLM retrieval
                            "type": "codebase_context"
                        }
                        
                        # Use the singleton store to upsert
                        pinecone_store.upsert_document(doc_id, chunk, metadata)
                    
                    indexed_files += 1
                except Exception as e:
                    print(f"[ERROR] Error indexing {rel_path}: {e}")

    print(f"[SUCCESS] Ingestion Complete! Indexed {indexed_files} files into Pinecone.")

if __name__ == "__main__":
    if not os.getenv("PINECONE_API_KEY"):
        print("[ERROR] PINECONE_API_KEY not found in .env.")
    else:
        ingest_application_context()
