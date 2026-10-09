import argparse
import chromadb
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.core.retrievers import AutoMergingRetriever

def main():
    parser = argparse.ArgumentParser(description="Test RAG retrieval from local ChromaDB")
    parser.add_argument("--query", type=str, help="Legal query to search for", required=False)
    parser.add_argument("--k", type=int, default=3, help="Number of results to return")
    args = parser.parse_args()

    print("Loading local embedding model...")
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    Settings.embed_model = embed_model
    Settings.llm = None

    print("Loading ChromaDB and Docstore...")
    db = chromadb.PersistentClient(path="./src/rag_engine/chroma_db")
    chroma_collection = db.get_or_create_collection("statutes")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Load storage context from the persisted directory
    try:
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store,
            persist_dir="./src/rag_engine/storage"
        )
    except FileNotFoundError:
        print("Error: Could not find the storage directory. Have you run 'python src/rag_engine/ingest.py' yet?")
        return

    # Load index from storage
    index = load_index_from_storage(storage_context)

    # Base retriever fetches the leaf nodes
    base_retriever = index.as_retriever(similarity_top_k=args.k)

    # AutoMergingRetriever detects if many child nodes belong to the same parent.
    # If they do, it merges them and returns the entire Parent context!
    retriever = AutoMergingRetriever(
        base_retriever, 
        storage_context, 
        verbose=True
    )

    query = args.query
    if not query:
        query = input("Enter your legal query: ")

    print(f"\nSearching for: '{query}'\n" + "-"*60)
    nodes = retriever.retrieve(query)
    
    for i, node in enumerate(nodes, 1):
        print(f"--- Result {i} ---")
        print(f"Source file: {node.metadata.get('file_name', 'Unknown')}")
        # Print up to 1500 characters of the matched context
        print(f"Text:\n{node.text.strip()[:1500]}...\n")

if __name__ == "__main__":
    main()
