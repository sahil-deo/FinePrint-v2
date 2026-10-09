import json
import uuid
import sys
import os

# Ensure the src directory is in the path so imports work correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tools.parser import parse_agreement
from agents import (
    clause_id_agent,
    invalid_clause_agent,
    risk_agent,
    advisory_agent,
    validation_agent
)

def process_contract(file_path: str) -> dict:
    """
    Main orchestrator workflow:
    1. Ingestion (Docling / Raw text)
    2. Clause extraction
    3. Loop: Illegality check -> Risk Assessment -> Advisory Redlines
    4. Final validation barrier
    """
    session_id = str(uuid.uuid4())
    print(f"🚀 Starting session {session_id} for file: {file_path}")
    
    # 1. Ingestion
    print("📄 Parsing agreement...")
    try:
        markdown_text = parse_agreement(file_path)
    except Exception as e:
        return {"error": f"Failed to parse agreement: {str(e)}"}
    
    # 2. Clause Identification
    print("🔍 Identifying clauses...")
    clause_prompt = (
        "Extract clauses from this contract. Return strictly a JSON array of objects "
        "with 'clause_number' and 'text' keys:\n\n"
        f"{markdown_text}"
    )
    # Note: Assuming adk Agent uses `.run(prompt)` for execution. 
    # Adjust this to `.generate()` or `.chat()` if your version of ADK expects that.
    clause_response = clause_id_agent.run(clause_prompt)
    
    try:
        # Strip potential markdown formatting from LLM response
        clean_json = clause_response.replace("```json", "").replace("```", "").strip()
        clauses = json.loads(clean_json)
    except Exception as e:
        print(f"Warning: Failed to parse JSON from clause agent: {e}")
        # Fallback to treat the whole doc as one clause if parsing fails
        clauses = [{"clause_number": "1", "text": clause_response}]

    analyzed_clauses = []
    
    # 3. Analyze each clause
    for clause in clauses:
        c_num = clause.get("clause_number", "Unknown")
        c_text = clause.get("text", "")
        
        print(f"⚖️ Analyzing Clause {c_num}...")
        
        # Invalid Clause Check
        invalid_prompt = (
            f"Session ID for Audit Logger: {session_id}\n"
            f"Clause Number: {c_num}\n"
            f"Evaluate this clause for illegality and unfairness:\n{c_text}"
        )
        legality_analysis = invalid_clause_agent.run(invalid_prompt)
        
        # Risk Assessment
        print(f"⚠️ Assessing Risk for Clause {c_num}...")
        risk_prompt = (
            f"Assess the risk for this clause based on the legality analysis.\n"
            f"Clause: {c_text}\n"
            f"Analysis: {legality_analysis}"
        )
        risk_assessment = risk_agent.run(risk_prompt)
        
        # Advisory / Redlining
        print(f"📝 Generating Advice & Redlines for Clause {c_num}...")
        advisory_prompt = (
            f"Explain this clause and provide a fair counter-clause:\n"
            f"Clause: {c_text}\n"
            f"Analysis: {legality_analysis}"
        )
        advisory_response = advisory_agent.run(advisory_prompt)
        
        # We attempt to parse the JSON returned by the advisory agent
        try:
            adv_clean = advisory_response.replace("```json", "").replace("```", "").strip()
            advisory_data = json.loads(adv_clean)
        except:
            advisory_data = {"raw_response": advisory_response}
        
        analyzed_clauses.append({
            "clause_number": c_num,
            "original_text": c_text,
            "legality_analysis": legality_analysis,
            "risk_assessment": risk_assessment,
            "advisory": advisory_data
        })
        
    # 4. Final Validation Barrier
    print("🛡️ Running final quality validation...")
    report_json = json.dumps(analyzed_clauses, indent=2)
    validation_prompt = (
        f"Review this final contract analysis report. Verify it is helpful, logically sound, "
        f"and has no contradictions. Provide your validation notes:\n\n{report_json}"
    )
    validation_notes = validation_agent.run(validation_prompt)
    
    final_report = {
        "session_id": session_id,
        "status": "completed",
        "validation_notes": validation_notes,
        "clauses": analyzed_clauses
    }
    
    print("✅ Processing complete!")
    return final_report

if __name__ == "__main__":
    # Simple CLI test hook
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        result = process_contract(test_file)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python orchestrator.py <path_to_contract_file>")
