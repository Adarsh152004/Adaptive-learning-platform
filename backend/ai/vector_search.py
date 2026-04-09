import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class VectorSearch:
    def __init__(self, model_name='all-MiniLM-L6-v2', index_path='ai/vector_index.faiss'):
        self.model = SentenceTransformer(model_name)
        self.index_path = index_path
        self.index = None
        self.documents = []
        self.load_index()

    def add_documents(self, docs):
        """Adds documents to the vector store."""
        if not docs:
            return
        
        self.documents.extend(docs)
        embeddings = self.model.encode(docs)
        
        if self.index is None:
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            
        self.index.add(np.array(embeddings).astype('float32'))
        self.save_index()

    def save_index(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.index_path + '.docs', 'w', encoding='utf-8') as f:
            for doc in self.documents:
                f.write(doc.replace('\n', ' ') + '\n')

    def load_index(self):
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            if os.path.exists(self.index_path + '.docs'):
                with open(self.index_path + '.docs', 'r', encoding='utf-8') as f:
                    self.documents = [line.strip() for line in f.readlines()]

    def search(self, query, k=3):
        """Searches for the k most relevant documents."""
        if self.index is None:
            return []
        
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for i in indices[0]:
            if i < len(self.documents):
                results.append(self.documents[i])
        return results

# Initialize a global instance for the app
vector_store = VectorSearch()

if __name__ == "__main__":
    # Test
    vs = VectorSearch()
    vs.add_documents([
        "The Python programming language is versatile and popular.",
        "Machine Learning involves algorithms that improve through data.",
        "MongoDB is a NoSQL database that stores data in JSON-like documents."
    ])
    results = vs.search("Tell me about databases")
    print(f"Search Results: {results}")
