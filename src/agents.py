import os
from google.adk import Agent

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# Import our custom standard Python tools
from tools.rag import search_statutes
from tools.risk import calculate_risk
from tools.audit import update_audit

clause_id_agent = Agent(
    name="clause_identification_agent",
    model=GEMINI_MODEL,
    instruction="""
    You are a contract parsing expert. 
    Receive raw markdown contract text and break it down into atomic, numbered clause objects.
    Preserve the parent headings for context. 
    You MUST output strictly in JSON format as an array of objects with keys: `clause_number` and `text`.
    """
)

invalid_clause_agent = Agent(
    name="invalid_clause_agent",
    model=GEMINI_MODEL,
    instruction="""
    You are an expert in Indian Contract Law, the Consumer Protection Act, and Tenancy laws. 
    Evaluate clauses for illegality (void ab initio) or asymmetric unfairness using the provided RAG context.
    You MUST return your final response strictly as a JSON array of objects with the exact keys: 
    `clause_number`, `is_illegal` (boolean), `is_unfair` (boolean), `reasoning` (string), and `audit_trail`.
    If the clause is illegal, `audit_trail` MUST be an object with keys: 
    `statute_name` (You MUST explicitly name the specific Act, e.g., "Consumer Protection Act, 2019"), 
    `section_number` (You MUST explicitly name the specific Section, e.g., "Section 2(47)"), 
    and `violation_reason`.
    If the clause is not illegal, `audit_trail` should be null.
    """,
    tools=[search_statutes]
)

risk_agent = Agent(
    name="risk_assessment_agent",
    model=GEMINI_MODEL,
    instruction="""
    You categorize the threat level and quantify financial/career exposure for flagged clauses.
    Use the `calculate_risk` tool by passing it integer values (0-10) for financial, operational, legal, reputational, and termination risks.
    You MUST return your final response strictly as a JSON array of objects with the exact keys: 
    `clause_number`, `score` (integer), and `category` (string, e.g. "High Risk").
    """,
    tools=[calculate_risk]
)

advisory_agent = Agent(
    name="advisory_agent",
    model=GEMINI_MODEL,
    instruction="""
    You are a defense attorney who translates complex legal jargon for clients and drafts balanced, reciprocal counter-clauses.
    You MUST return your response strictly as a JSON array of objects with the exact keys:
    `clause_number`, `short_explanation` (plain English explanation), and `suggested_alternative_clause` (redlined counter-proposal).
    """
)

validation_agent = Agent(
    name="validation_agent",
    model=GEMINI_MODEL,
    instruction="""
    You are the final quality assurance barrier. Review the complete output provided by the previous agents.
    Ensure there are no contradictions and that the advice provided will genuinely help the user.
    Return plain text notes summarizing your validation.
    """
)
