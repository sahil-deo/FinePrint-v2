import chromadb
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.retrievers import AutoMergingRetriever
import os

# Initialize globally to avoid reloading the models and DB on every tool call
_retriever = None

def search_statutes(query: str) -> str:
    """
    Search the Indian statutory knowledge base for relevant laws and sections.
    Use this tool when evaluating a contract clause to find the relevant legal constraints.
    """
    global _retriever
    
    if _retriever is None:
        embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
        Settings.embed_model = embed_model
        Settings.llm = None
        
        # Resolve paths relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        rag_dir = os.path.join(base_dir, "..", "rag_engine")
        db_path = os.path.join(rag_dir, "chroma_db")
        storage_path = os.path.join(rag_dir, "storage")
        
        db = chromadb.PersistentClient(path=db_path)
        chroma_collection = db.get_or_create_collection("statutes")
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store,
            persist_dir=storage_path
        )
        
        index = load_index_from_storage(storage_context)
        base_retriever = index.as_retriever(similarity_top_k=3)
        _retriever = AutoMergingRetriever(base_retriever, storage_context, verbose=False)
        
    nodes = _retriever.retrieve(query)
    
    if not nodes:
        return "No relevant statutes found."
        
    results = []
    for i, node in enumerate(nodes, 1):
        source = node.metadata.get('file_name', 'Unknown')
        text = node.text.strip()
        results.append(f"--- Result {i} (Source: {source}) ---\n{text}\n")
        
    return "\n".join(results)
