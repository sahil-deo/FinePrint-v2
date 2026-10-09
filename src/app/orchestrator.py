import json
import uuid
import sys
import os
import time
import re

# Ensure the src directory is in the path so imports work correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from google.genai import types
from google.adk.runners import InMemoryRunner

from tools.parser import parse_agreement
from tools.rag import search_statutes
from agents import (
    clause_id_agent,
    invalid_clause_agent,
    risk_agent,
    advisory_agent,
    validation_agent
)


def log(msg: str, start_time: float = None):
    """Print a timestamped log message with optional elapsed time (no emojis)."""
    elapsed = ""
    if start_time is not None:
        elapsed = f" ({time.time() - start_time:.1f}s)"
    print(f"[{time.strftime('%H:%M:%S')}] {msg}{elapsed}")


def extract_json(text: str):
    """Robustly extract JSON array or object from LLM response."""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('[')
        end = text.rfind(']') + 1
        if start == -1 or end == 0:
            start = text.find('{')
            end = text.rfind('}') + 1
        if start != -1 and end != 0:
            try:
                return json.loads(text[start:end])
            except Exception:
                pass
        raise ValueError("Could not extract valid JSON from response")


def run_agent(agent, prompt: str, agent_label: str = "Agent") -> str:
    """Runs a Google ADK agent and collects the final text response."""
    log(f"  -> Calling {agent_label}...")
    t = time.time()

    runner = InMemoryRunner(agent=agent, app_name="synapse")
    user_id = "synapse_user"
    session_id = str(uuid.uuid4())

    runner.session_service.create_session_sync(
        app_name="synapse",
        user_id=user_id,
        session_id=session_id,
    )

    user_message = types.Content(
        role="user",
        parts=[types.Part(text=prompt)]
    )

    final_text = ""
    for event in runner.run(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message,
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    log(f"  - {agent_label} responded", t)
    return final_text.strip()


def process_contract(file_path: str) -> dict:
    """Batched Orchestrator workflow with clean logging."""
    total_start = time.time()
    session_id = str(uuid.uuid4())
    log(f"Starting session {session_id}")
    log(f"File: {file_path}")

    # 1. Ingestion
    t = time.time()
    log("Step 1/7 - Parsing agreement...")
    try:
        markdown_text = parse_agreement(file_path)
    except Exception as e:
        log(f"Parsing failed: {e}")
        return {"error": f"Failed to parse agreement: {str(e)}"}
    log(f"Parsing complete ({len(markdown_text)} chars)", t)

    # 2. Clause Identification
    t = time.time()
    log("Step 2/7 - Extracting all clauses (1 LLM Call)...")
    clause_prompt = (
        "Extract clauses from this contract. Return strictly a JSON array of objects "
        "with 'clause_number' and 'text' keys:\n\n"
        f"{markdown_text}"
    )
    clause_response = run_agent(clause_id_agent, clause_prompt, "Clause Identification Agent")

    try:
        clauses = extract_json(clause_response)
    except Exception as e:
        log(f"Warning: Failed to parse clause JSON ({e}), treating as single clause")
        clauses = [{"clause_number": "1", "text": clause_response}]

    log(f"Found {len(clauses)} clauses", t)

    # 3. Direct RAG Search
    t = time.time()
    log("Step 3/7 - Running local RAG search for all clauses...")
    clauses_with_context = []
    for clause in clauses:
        c_num = clause.get("clause_number", "Unknown")
        c_text = clause.get("text", "")
        rag_results = search_statutes(c_text)
        clauses_with_context.append({
            "clause_number": c_num,
            "text": c_text,
            "legal_context": rag_results
        })
    log("RAG context gathered", t)

    clauses_payload = json.dumps(clauses_with_context, indent=2)

    # 4. Invalid Clause Analysis
    t = time.time()
    log("Step 4/7 - Identifying all illegal/unfair clauses (1 LLM Call)...")
    invalid_prompt = (
        f"Session ID for Audit Logger: {session_id}\n"
        "Below is a JSON array of contract clauses along with relevant legal context from Indian Law (RAG results). "
        "Evaluate ALL of them. For each clause, use the context to determine if it is strictly illegal or legal-but-unfair. "
        "IMPORTANT: Use your `update_audit` tool to log any illegal findings using the provided Session ID. "
        "You MUST output your final analysis strictly as a JSON array of objects with keys: "
        "'clause_number', 'is_illegal' (boolean), 'is_unfair' (boolean), and 'reasoning'.\n\n"
        f"{clauses_payload}"
    )
    legality_response = run_agent(invalid_clause_agent, invalid_prompt, "Invalid Clause Agent")
    try:
        legality_data = extract_json(legality_response)
        if isinstance(legality_data, dict): legality_data = [legality_data]
    except Exception:
        legality_data = []
    legality_map = {str(r.get("clause_number")): r for r in legality_data}
    log("Legality analysis complete", t)

    # 5. Risk Assessment
    t = time.time()
    log("Step 5/7 - Assessing risks for all clauses (1 LLM Call)...")
    risk_prompt = (
        "Based on the following legality analysis of multiple clauses, assess the risk for each clause. "
        "Return your assessment strictly as a JSON array of objects with keys: 'clause_number', 'score', 'category' (e.g. High Risk). "
        "Use your `calculate_risk` tool if helpful to determine the score.\n\n"
        f"Analysis:\n{json.dumps(legality_data)}"
    )
    risk_response = run_agent(risk_agent, risk_prompt, "Risk Assessment Agent")
    try:
        risk_data = extract_json(risk_response)
        if isinstance(risk_data, dict): risk_data = [risk_data]
    except Exception:
        risk_data = []
    risk_map = {str(r.get("clause_number")): r for r in risk_data}
    log("Risk assessment complete", t)

    # 6. Advisory / Redlines
    t = time.time()
    log("Step 6/7 - Generating advice & redlines for all clauses (1 LLM Call)...")
    advisory_prompt = (
        "For all the clauses evaluated in the analysis below, explain the issues in plain English and provide fair counter-clauses. "
        "Return strictly a JSON array of objects with keys: 'clause_number', 'short_explanation', 'suggested_alternative_clause'.\n\n"
        f"Analysis:\n{json.dumps(legality_data)}"
    )
    advisory_response = run_agent(advisory_agent, advisory_prompt, "Advisory Agent")
    try:
        advisory_data = extract_json(advisory_response)
        if isinstance(advisory_data, dict): advisory_data = [advisory_data]
    except Exception:
        advisory_data = []
    advisory_map = {str(a.get("clause_number")): a for a in advisory_data}
    log("Advisory complete", t)

    # Combine into Final Report
    analyzed_clauses = []
    for clause in clauses:
        c_num = str(clause.get("clause_number", "Unknown"))
        analyzed_clauses.append({
            "clause_number": c_num,
            "original_text": clause.get("text"),
            "legality_analysis": legality_map.get(c_num, {"is_illegal": False, "is_unfair": False, "reasoning": "Not flagged"}),
            "risk_assessment": risk_map.get(c_num, {"category": "Low Risk", "score": 0}),
            "advisory": advisory_map.get(c_num, {"short_explanation": "No significant issues flagged.", "suggested_alternative_clause": "N/A"})
        })

    # 7. Final Validation
    t = time.time()
    log("Step 7/7 - Running final quality validation (1 LLM Call)...")
    report_json = json.dumps(analyzed_clauses, indent=2)
    validation_prompt = (
        "Review this final contract analysis report. Verify it is helpful, logically sound, "
        "and has no contradictions. Provide your validation notes:\n\n"
        f"{report_json}"
    )
    validation_notes = run_agent(validation_agent, validation_prompt, "Validation Agent")
    log("Validation complete", t)

    final_report = {
        "session_id": session_id,
        "status": "completed",
        "validation_notes": validation_notes,
        "clauses": analyzed_clauses
    }

    log("Batch Processing complete! Total time", total_start)
    return final_report


if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        result = process_contract(test_file)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python orchestrator.py <path_to_contract_file>")
