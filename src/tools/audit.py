import sqlite3
import os

_db_path = os.path.join(os.path.dirname(__file__), "..", "..", "audit.db")

def get_db_connection():
    conn = sqlite3.connect(_db_path)
    # Create table if it doesn't exist
    conn.execute('''
        CREATE TABLE IF NOT EXISTS audit_trail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            clause_number TEXT,
            statute_name TEXT,
            section_number TEXT,
            violation_reason TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

def update_audit(session_id: str, clause_number: str, statute_name: str, section_number: str, violation_reason: str) -> str:
    """
    Store the legal audit trail in SQLite.
    This temporarily stores the citations used by the agent during the analysis of a specific session.
    """
    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO audit_trail (session_id, clause_number, statute_name, section_number, violation_reason)
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, clause_number, statute_name, section_number, violation_reason))
            conn.commit()
        
        return f"Successfully logged audit trail for clause {clause_number}."
    except Exception as e:
        return f"Failed to log audit trail: {str(e)}"
