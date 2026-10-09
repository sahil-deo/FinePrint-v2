import os
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.core.node_parser import HierarchicalNodeParser, get_leaf_nodes
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import Settings
import chromadb

def main():
    print("Loading PDFs from src/rag_engine/knowledge-base...")
    # Load all documents from the directory
    documents = SimpleDirectoryReader("src/rag_engine/knowledge-base").load_data()
    print(f"Loaded {len(documents)} document pages.")

    print("Configuring local embedding model (BAAI/bge-small-en-v1.5)...")
    # Initialize the local embedding model
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    Settings.embed_model = embed_model
    Settings.llm = None  # No LLM needed for pure ingestion

    print("Setting up Hierarchical Node Parser...")
    # Parent chunks (2048) capture broad sections
    # Child chunks (512) and Leaf chunks (128) are used for exact semantic matches
    node_parser = HierarchicalNodeParser.from_defaults(
        chunk_sizes=[2048, 512, 128]
    )
    
    # Parse documents into a hierarchy of nodes
    nodes = node_parser.get_nodes_from_documents(documents)
    # Extract only the leaf (smallest) nodes to embed into ChromaDB
    leaf_nodes = get_leaf_nodes(nodes)
    print(f"Extracted {len(nodes)} total nodes and {len(leaf_nodes)} leaf nodes.")

    print("Initializing ChromaDB...")
    # Setup ChromaDB client to save locally
    os.makedirs("./src/rag_engine/chroma_db", exist_ok=True)
    db = chromadb.PersistentClient(path="./src/rag_engine/chroma_db")
    chroma_collection = db.get_or_create_collection("statutes")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Create a storage context
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # IMPORTANT: We must add all nodes (including parents) to the docstore
    # so the retriever can reconstruct the full sections later.
    storage_context.docstore.add_documents(nodes)

    print("Embedding and indexing leaf nodes (this might take a few moments)...")
    index = VectorStoreIndex(
        leaf_nodes,
        storage_context=storage_context,
        show_progress=True
    )

    print("Persisting full docstore to ./src/rag_engine/storage...")
    # We persist the docstore locally so test_rag.py can access the parent chunks
    storage_context.persist(persist_dir="./src/rag_engine/storage")

    print("Ingestion complete! Vector database is ready.")

if __name__ == "__main__":
    main()
