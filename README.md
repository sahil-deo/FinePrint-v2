# Synapse: Agentic Legal Contract Analysis

## Problem Statement
Legal agreements are dense and complex. Individuals and small businesses often sign contracts without fully understanding hidden liabilities, asymmetric obligations, or outright illegal clauses. Traditional legal counsel is expensive and slow, leaving laypeople vulnerable to predatory terms and unenforceable conditions.

## Proposed Solution
Synapse is an automated, multi-agent legal review pipeline. It ingests contracts, segments them into distinct clauses, and validates them against statutory laws. By utilizing a batched agentic workflow, it flags illegalities, quantifies risk, provides plain English explanations, and generates fair counter-clauses. Every flagged issue includes a statutory audit trail to ensure legal grounding.

## Features
* Multi-format Ingestion: Parse text, markdown, PDFs, and images natively.
* Statutory RAG Pipeline: Fetches relevant legal context (e.g., Contract Act, Consumer Protection Act) to ground the evaluation.
* Agentic Analysis: A sequence of specialized agents (Parser, Legality, Risk, Advisory, Validator) handles discrete legal reasoning steps.
* Batched Processing: Overcomes strict LLM API rate limits by evaluating all clauses in a single optimized pass.
* Statutory Audit Trail: Logs the specific Acts and Sections cited during the analysis into a local database for full transparency.
* Interactive UI: A responsive, dependency-free frontend featuring a real-time progress pipeline, theme toggling, and linked risk cards.

## Technical Implementation
The backend is built with FastAPI. When a document is uploaded or pasted, it is converted to Markdown using a document parser. An orchestrator script then batches the clauses and routes them through Google ADK agents powered by Gemini. These agents execute custom Python tools, including a RAG retriever for legal context and a SQLite database logger for the audit trail. The frontend polls a status endpoint to visualize the agent pipeline in real-time, subsequently rendering the structured JSON results into an interactive dashboard.

## Setup Instructions
1. Clone the repository to your local machine and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd Synapse
   ```
2. Ensure you have Python (>=3.13) installed. Install the `uv` package manager if you haven't already:
   
   **For macOS and Linux:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Or using Homebrew on macOS:
   brew install uv
   ```
   **For Windows (PowerShell):**
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
3. Install the required dependencies using `uv`:
   ```bash
   uv sync
   ```
4. Copy the environment variables example file:
   ```bash
   cp .env.example .env
   ```
5. Open the `.env` file and add your `GOOGLE_API_KEY` (get one from Google AI Studio).
6. **Initialize the RAG Database:** Before running the app, you must embed the legal statutes in the knowledge base. Run the ingestion script:
   ```bash
   uv run python src/rag_engine/ingest.py
   ```
   *(This will download a local HuggingFace embedding model and process the PDFs in `src/rag_engine/knowledge-base` into a local ChromaDB vector store).*

## Usage Instructions
1. Start the FastAPI backend server using `uv`:
   ```bash
   uv run python src/app/main.py
   ```
   *(This command automatically uses the virtual environment created during setup).*
2. Open a web browser and navigate to `http://localhost:8000`.
3. Use the interface to either upload a contract file or paste the raw text directly.
4. Click the analyze button and watch the real-time agent pipeline visualization.
5. Review the findings feed on the right side of the screen. Click on any finding to instantly highlight the corresponding clause in the original document.

## Technologies Used
* Python
* FastAPI
* Google ADK
* Gemini API
* Docling
* SQLite3
* Vanilla HTML, CSS, and JavaScript

## Limitations / Future Scope
* NLP clause identification: Upgrading from prompt-based segmentation to dedicated Natural Language Processing models to ensure perfectly robust clause boundaries.
* ML for risk assessment: Training specialized Machine Learning classifiers for granular risk scoring instead of relying solely on LLM heuristics.
* Graph based workflow for better looping and validation: Implementing a directed acyclic graph structure to allow agents to seamlessly loop back, cross-check, and re-evaluate findings before presenting the final output.
