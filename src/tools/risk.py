import json

def calculate_risk(financial_exposure: int, operational_burden: int, legal_liability: int, reputational_risk: int, termination_difficulty: int) -> str:
    """
    Calculate the risk score of a contract clause.
    All inputs must be integers from 0 to 10.
    """
    total_score = financial_exposure + operational_burden + legal_liability + reputational_risk + termination_difficulty
    
    if total_score <= 20:
        category = "Low Risk"
    elif total_score <= 40:
        category = "Mid Risk"
    else:
        category = "High Risk"
        
    return json.dumps({
        "score": total_score,
        "category": category,
        "max_possible": 50
    })
