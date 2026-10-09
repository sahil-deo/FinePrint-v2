import os
from dotenv import load_dotenv
load_dotenv()

import sqlite3
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from orchestrator import process_contract

app = FastAPI()

# Ensure static folder exists
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

def get_audit_logs(session_id: str):
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "audit.db")
    if not os.path.exists(db_path):
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT clause_number, statute_name, section_number, violation_reason, timestamp FROM audit_trail WHERE session_id = ?", 
            (session_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        return []

@app.post("/api/analyze")
async def analyze_document(file: UploadFile = File(...)):
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run the AI workflow
    report = process_contract(temp_path)
    
    # Fetch audit logs based on the session ID
    session_id = report.get("session_id")
    audit_logs = get_audit_logs(session_id) if session_id else []
    
    # Clean up temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    return {
        "report": report,
        "audit_logs": audit_logs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
