# Fine Print: Agentic Legal Contract Analysis

Fine Print is an automated, multi-agent legal review pipeline designed to protect individuals and small businesses from unfair, predatory, or legally unenforceable contracts. By combining local document parsing, hierarchical statutory RAG, Google ADK agents powered by Gemini, and a deterministic audit trail, Fine Print flags illegal terms, quantifies multi-dimensional exposure, and provides fair, redlined counter-clauses in plain English.

---

## Problem Statement
Legal agreements are dense, convoluted, and heavily skewed in favor of drafting entities. Non-lawyers and small businesses frequently sign agreements without understanding hidden liabilities, unilateral termination powers, or outright void clauses. Traditional legal counsel is expensive and slow, leaving signers vulnerable to predatory conditions and unenforceable terms.

## Proposed Solution
Fine Print provides a real-time, transparent legal review pipeline:
1. **Parses** uploaded contracts and images natively into clean Markdown.
2. **Segments** agreements into discrete, structured clauses.
3. **Retrieves** relevant statutory constraints from Indian law via local hierarchical vector search.
4. **Validates** clauses against codified statutes, flagging void terms and extracting statutory citations.
5. **Quantifies** risk using an objective 5-dimension risk scoring engine.
6. **Drafts** plain-English explanations and reciprocal counter-proposals.
7. **Logs** every legal finding into a tamper-evident statutory audit trail.

---

## Architectural Workflow

Fine Print utilizes a batched 7-stage pipeline to overcome LLM rate limits while preserving end-to-end legal reasoning:

```
[Contract File / Text]
       │
       ▼
1. Document Ingestion & Parser (Docling: PDF/OCR/TXT -> Markdown)
       │
       ▼
2. Clause Identification Agent (Google ADK: Atomic JSON Clause Segmentation)
       │
       ▼
3. Statutory RAG Retrieval (Hierarchical ChromaDB + AutoMergingRetriever)
       │
       ▼
4. Invalid Clause Analysis Agent (Google ADK: Statutary Checks + SQLite Audit Logging)
       │
       ▼
5. Risk Assessment Agent (Google ADK: 5-Factor Risk Scoring Tool)
       │
       ▼
6. Advisory Agent (Google ADK: Plain-English Summaries & Redline Counter-Clauses)
       │
       ▼
7. Validation Agent (Google ADK: Consistency & Quality Assurance QA)
       │
       ▼
[Interactive UI Dashboard & Audit Logs]
```

### 1. Multi-Format Ingestion (`src/tools/parser.py`)
- Direct text extraction for `.txt` and `.md` files.
- Uses **Docling** (`DocumentConverter`) for native PDF layout parsing and image OCR (`.png`, `.jpg`, `.jpeg`), converting documents into clean, structured Markdown while preserving headings.

### 2. Clause Identification Agent (`src/agents.py`)
- Powered by Google ADK and Gemini (`clause_id_agent`).
- Receives raw Markdown and breaks it down into atomic numbered clause objects (`clause_number`, `text`) in a single pass.

### 3. Statutory RAG Pipeline (`src/tools/rag.py`)
- Evaluates each clause against local Indian statutory law.
- **Embedding Model**: `BAAI/bge-small-en-v1.5` via HuggingFace.
- **Hierarchical Chunking**: Documents are split into 3 tiers:
  - Parent chunks: 2048 tokens (captures broad statutory chapters and context).
  - Child chunks: 512 tokens.
  - Leaf chunks: 128 tokens (stored in ChromaDB for high-precision semantic matching).
- **AutoMergingRetriever**: Retrieves top leaf nodes and automatically reconstructs the full parent statutory context when multiple leaf nodes match the same section.
- **Embedded Knowledge Base (`src/rag_engine/knowledge-base/`)**:
  - *The Indian Contract Act, 1872*
  - *The Consumer Protection Act, 2019*
  - *The Model Tenancy Act, 2021*

### 4. Invalid Clause Analysis & Audit Logger (`src/agents.py` & `src/tools/audit.py`)
- Evaluates clauses for illegality (*void ab initio*) or asymmetric unfairness using retrieved statutory context (`invalid_clause_agent`).
- Output extracts exact legal citations: `statute_name` (e.g., *Consumer Protection Act, 2019*), `section_number` (e.g., *Section 2(47)*), and `violation_reason`.
- Automatically logs all verified illegal clauses into a persistent SQLite database (`audit.db`) with session IDs and timestamps.

### 5. Multi-Factor Risk Assessment (`src/tools/risk.py`)
- The `risk_agent` evaluates clauses using the `calculate_risk` tool across 5 distinct dimensions (rated 0 to 10 each, maximum score of 50):
  - **Financial Exposure** (0–10)
  - **Operational Burden** (0–10)
  - **Legal Liability** (0–10)
  - **Reputational Risk** (0–10)
  - **Termination Difficulty** (0–10)
- **Risk Tiers**:
  - **Low Risk**: Total score $\le 20$
  - **Mid Risk**: Total score $21 - 40$
  - **High Risk**: Total score $> 40$

### 6. Advisory & Redline Counter-Clauses (`src/agents.py`)
- The `advisory_agent` acts as defense counsel:
  - Translates legalese into plain, accessible English (`short_explanation`).
  - Drafts balanced, reciprocal counter-proposals (`suggested_alternative_clause`).

### 7. Validation Barrier (`src/agents.py`)
- The `validation_agent` reviews aggregated findings across all agents to detect contradictions, eliminate hallucinations, and ensure actionable user advice.

---

## Database Schema (Statutory Audit Trail)

Every flagged statutory illegality is permanently recorded in `audit.db` under the `audit_trail` table:

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | Auto-incrementing log entry ID |
| `session_id` | `TEXT NOT NULL` | UUID for the specific analysis run |
| `clause_number` | `TEXT` | Specific clause identifier |
| `statute_name` | `TEXT` | Codified act (e.g., *Indian Contract Act, 1872*) |
| `section_number` | `TEXT` | Section reference (e.g., *Section 23*) |
| `violation_reason`| `TEXT` | Explanation of statutory non-compliance |
| `timestamp` | `DATETIME` | Time of audit logging (UTC) |

---

## API Reference

The backend provides the following REST endpoints via FastAPI (`src/app/main.py`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the interactive web application interface. |
| `POST` | `/api/analyze` | Accepts multipart form data with a `file` (`.pdf`, `.txt`, `.md`, `.png`, `.jpg`). Executes the 7-stage workflow and returns the final `{ report, audit_logs }`. |
| `GET` | `/api/status` | Real-time status polling endpoint returning `{ "step": int, "message": str }` to drive the frontend visual pipeline graph. |
| `GET` | `/static/*` | Serves client stylesheets and scripts. |

---

## Setup & Installation

### Prerequisites
- Python 3.13 or higher
- [uv](https://github.com/astral-sh/uv) package manager
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sahil-deo/FinePrint-v2
cd Fine Print
uv sync
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and set your API key and preferred model:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```
*(Supported models include `gemini-2.0-flash`, `gemini-2.5-flash-preview-05-20`, `gemini-2.5-pro-preview-06-05`).*

### 3. Initialize Statutory RAG Vector Database
Before running the server, embed the legal acts into the local ChromaDB store:
```bash
uv run python src/rag_engine/ingest.py
```
*(This downloads the local `BAAI/bge-small-en-v1.5` model, parses PDFs from `src/rag_engine/knowledge-base/`, and saves ChromaDB vectors to `src/rag_engine/chroma_db` and docstore hierarchies to `src/rag_engine/storage`).*

---

## Usage Instructions

### Web Interface
1. Launch the FastAPI server:
   ```bash
   uv run python src/app/main.py
   ```
2. Open your browser and navigate to `http://localhost:8000`.
3. Drag & drop a contract (`.pdf`, `.txt`, `.md`, or image) or paste contract text directly.
4. Click **Analyze** to watch the real-time 7-node pipeline progress indicator.
5. Inspect clause-by-clause risk ratings, statutory audit citations, and alternative counter-proposals.

### CLI Utilities

#### Run Standalone Contract Analysis
Process a contract file directly in your terminal without starting the web server:
```bash
uv run python src/app/orchestrator.py <path_to_contract_file>
```

#### Query the Statutory Knowledge Base
Test RAG retrieval and inspect matched legal sections:
```bash
uv run python src/rag_engine/test_rag.py --query "unilateral termination without notice" --k 3
```

---

## Technologies Used

- **Language & Runtime**: Python >=3.13, `uv`
- **Agent Framework**: Google ADK (`google-adk`), Google GenAI SDK (`google-genai`)
- **LLM**: Google Gemini (`gemini-2.0-flash`)
- **RAG & Vector Search**: LlamaIndex Core, ChromaDB, `BAAI/bge-small-en-v1.5` HuggingFace Embeddings, `AutoMergingRetriever`
- **Document Ingestion**: Docling (`docling` DocumentConverter)
- **Backend & Storage**: FastAPI, Uvicorn, SQLite3
- **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript, `html2pdf.js`
