document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    // Update UI State
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Analysis failed on the server');
        }
        
        const data = await response.json();
        renderResults(data);
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('resultsSection').classList.remove('hidden');
    } catch (error) {
        alert('Error processing document: ' + error.message);
        document.getElementById('loading').classList.add('hidden');
    }
});

// Handle Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

function renderResults(data) {
    const report = data.report;
    const auditLogs = data.audit_logs;

    // Render Validation Notes from the Validation Agent
    const valBanner = document.getElementById('validationNotes');
    valBanner.innerHTML = `<strong>Validation Notes:</strong> ${report.validation_notes || "No notes provided."}`;
    
    // Render Clauses and Advice
    const container = document.getElementById('clausesContainer');
    container.innerHTML = '';
    
    if (report.clauses && report.clauses.length > 0) {
        report.clauses.forEach(clause => {
            const card = document.createElement('div');
            card.className = 'clause-card';
            
            // Try to extract Risk category and assign a color
            let riskCategory = "Unknown Risk";
            let badgeColor = "#94a3b8"; // default Gray
            try {
                const riskStr = typeof clause.risk_assessment === 'string' 
                    ? clause.risk_assessment.replace(/```json|```/g, '').trim()
                    : clause.risk_assessment;
                
                // If it's a JSON string, parse it
                const riskData = typeof riskStr === 'string' && riskStr.startsWith('{') 
                    ? JSON.parse(riskStr) 
                    : riskStr;
                    
                if (riskData && riskData.category) {
                    riskCategory = riskData.category;
                    if (riskCategory.toLowerCase().includes("high")) badgeColor = "var(--high-risk)";
                    else if (riskCategory.toLowerCase().includes("mid")) badgeColor = "var(--mid-risk)";
                    else if (riskCategory.toLowerCase().includes("low")) badgeColor = "var(--low-risk)";
                } else if (typeof riskStr === 'string') {
                    // Fallback to text match
                    riskCategory = riskStr;
                }
            } catch (e) {
                console.error("Risk parsing error", e);
            }

            // Extract Advice safely (handles structure enforcement)
            const explanation = clause.advisory?.short_explanation || clause.advisory?.raw_response || "No simple explanation provided.";
            const alternative = clause.advisory?.suggested_alternative_clause || "No alternative provided.";

            card.innerHTML = `
                <div class="clause-header">
                    <h3>Clause ${clause.clause_number}</h3>
                    <span class="risk-badge" style="background-color: ${badgeColor}">${riskCategory}</span>
                </div>
                <h4>Original Text:</h4>
                <div class="original-text">${clause.original_text || 'No text found'}</div>
                
                <div class="advice-section">
                    <h4>Simplified Explanation</h4>
                    <p>${explanation}</p>
                    <h4>Suggested Alternative</h4>
                    <p><em>${alternative}</em></p>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = "<p>No clauses were successfully extracted.</p>";
    }

    // Render Audit Logs Table
    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = '';
    if (auditLogs && auditLogs.length > 0) {
        auditLogs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Clause ${log.clause_number || '-'}</td>
                <td>${log.statute_name || 'N/A'}</td>
                <td>${log.section_number || 'N/A'}</td>
                <td>${log.violation_reason || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No statutory violations found in this document.</td></tr>`;
    }
}
