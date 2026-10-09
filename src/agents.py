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
    Evaluate clauses for direct statutory illegality (void ab initio) or asymmetric unfairness.
    You MUST use the `search_statutes` tool to ground your analysis in actual law.
    """,
    tools=[search_statutes]
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
# Drafts the redlines/counter-clauses
advisory_agent = Agent(
    name="Advisory Agent",
    instructions="""
    You are a defense attorney drafting balanced, reciprocal counter-clauses. 
    Generate fair, legally sound replacement language adopting the original contract's vocabulary so the signer can counter-propose.
    """
)

# 5. Validation & Audit Agent
# Ensures no hallucinations and logs the data
validation_agent = Agent(
    name="Validation Agent",
    instructions="""
    You are the final enforcement gate. Verify that any cited legal sections actually exist based on the RAG context.
    Once verified, you MUST use the `update_audit` tool to push the final citation and violation reason to the audit trail.
    """,
    tools=[update_audit]
)
