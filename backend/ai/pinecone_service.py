import os
from pinecone import Pinecone, ServerlessSpec
from google.generativeai import embed_content
from dotenv import load_dotenv

load_dotenv()

class PineconeService:
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.environment = os.getenv("PINECONE_ENVIRONMENT")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "learnsphere-index")
        
        if self.api_key:
            self.pc = Pinecone(api_key=self.api_key)
            # Create index if it doesn't exist
            if self.index_name not in self.pc.list_indexes().names():
                self.pc.create_index(
                    name=self.index_name,
                    dimension=768, # Gemini embedding dimension
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
            self.index = self.pc.Index(self.index_name)
        else:
            self.index = None
            print("WARNING: PINECONE_API_KEY not found. Vector search will be disabled.")

    def get_embedding(self, text):
        """Get embeddings using Gemini (Reliable & Free)."""
        result = embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
            title="Embedding for LearnSphere"
        )
        return result['embedding']

    def upsert_document(self, doc_id, text, metadata=None):
        if not self.index: return
        embedding = self.get_embedding(text)
        self.index.upsert(vectors=[(doc_id, embedding, metadata or {})])

    def query_documents(self, query_text, top_k=3):
        if not self.index: return []
        query_embedding = self.get_embedding(query_text)
        results = self.index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
        return [match.metadata.get('text', '') for match in results.matches]

# Singleton instance
pinecone_store = PineconeService()
