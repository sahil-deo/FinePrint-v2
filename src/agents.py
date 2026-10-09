from adk import Agent

# Import our custom standard Python tools
from tools.rag import search_statutes
from tools.risk import calculate_risk
from tools.audit import update_audit

# 1. Clause Identification Agent
# Breaks the raw markdown document into atomic clause objects
clause_id_agent = Agent(
    name="Clause Identification Agent",
    instructions="""
    You are a contract parsing expert. 
    Receive raw markdown contract text and break it down into atomic, numbered clause objects.
    Preserve the parent headings for context. Output strictly in JSON format.
    """
)

# 2. Invalid Clause Agent
# Checks clauses against Indian statutory law and fairness heuristics
invalid_clause_agent = Agent(
    name="Invalid Clause Agent",
    instructions="""
    You are an expert in Indian Contract Law, the Consumer Protection Act, and Tenancy laws. 
    Your responsibility is to identify clauses that are legal but unfair, AND to identify clauses that are strictly illegal.
    You MUST use the `search_statutes` tool to ground your analysis in actual law.
    Whenever you identify an illegal clause, you MUST use the `update_audit` tool to log the legal audit trail, explaining exactly why it is illegal and citing where it is stated in the statutes.
    """,
    tools=[search_statutes, update_audit]
)

# 3. Risk Assessment Agent
# Quantifies the threat level of flagged clauses
risk_agent = Agent(
    name="Risk Assessment Agent",
    instructions="""
    You categorize the threat level and quantify financial/career exposure for flagged clauses.
    You MUST use the `calculate_risk` tool by passing it integer values (0-10) for financial, operational, legal, reputational, and termination risks.
    """,
    tools=[calculate_risk]
)

# 4. Advisory Agent
# Explains clauses in plain English and drafts redlines/counter-clauses
advisory_agent = Agent(
    name="Advisory Agent",
    instructions="""
    You are a defense attorney who translates complex legal jargon for clients and drafts balanced, reciprocal counter-clauses.
    You have two specific jobs:
    1. Explain the original clause in a normal, easy-to-understand way.
    2. Generate fair, legally sound replacement language adopting the original contract's vocabulary so the signer can counter-propose.
    
    You MUST return your response as a structured JSON object containing exactly two keys:
    - "short_explanation": Your plain-English explanation of the original clause.
    - "suggested_alternative_clause": The fair, redlined counter-proposal.
    """
)

# 5. Validation Agent
# Final quality barrier to ensure the overall response is helpful and makes sense
validation_agent = Agent(
    name="Validation Agent",
    instructions="""
    You are the final quality assurance barrier. Review the complete output provided by the previous agents.
    Your job is to check if the overall response is helpful, clear, logically sound, and directly answers the user's needs. 
    Ensure there are no contradictions and that the advice provided will genuinely help the user understand and negotiate their contract.
    """
)
