// Tab Switching Logic
const tabUpload = document.getElementById('tabUpload');
const tabPaste = document.getElementById('tabPaste');
const uploadView = document.getElementById('uploadView');
const pasteView = document.getElementById('pasteView');
let currentMode = 'upload';

tabUpload.addEventListener('click', () => {
    currentMode = 'upload';
    tabUpload.classList.add('active');
    tabPaste.classList.remove('active');
    uploadView.classList.remove('hidden');
    pasteView.classList.add('hidden');
    document.getElementById('fileInput').required = true;
    document.getElementById('textInput').required = false;
});

tabPaste.addEventListener('click', () => {
    currentMode = 'paste';
    tabPaste.classList.add('active');
    tabUpload.classList.remove('active');
    pasteView.classList.remove('hidden');
    uploadView.classList.add('hidden');
    document.getElementById('textInput').required = true;
    document.getElementById('fileInput').required = false;
});

// Form Submission Logic
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    if (currentMode === 'upload') {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length === 0) return;
        formData.append('file', fileInput.files[0]);
    } else {
        const text = document.getElementById('textInput').value;
        if (!text.trim()) return;
        // Create a Blob to simulate a text file upload behind the scenes
        const blob = new Blob([text], { type: 'text/plain' });
        formData.append('file', blob, 'pasted_contract.txt');
    }

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

function renderResults(data) {
    const report = data.report;
    const auditLogs = data.audit_logs || [];

    // Group audit logs by clause number
    const auditByClause = {};
    auditLogs.forEach(log => {
        const cNum = String(log.clause_number);
        if (!auditByClause[cNum]) auditByClause[cNum] = [];
        auditByClause[cNum].push(log);
    });

    // Render Validation Notes
    const valBanner = document.getElementById('validationNotes');
    valBanner.innerHTML = `<strong>Validation Quality Check:</strong> ${report.validation_notes || "No notes provided."}`;
    
    // Render Clauses
    const container = document.getElementById('clausesContainer');
    container.innerHTML = '';
    
    if (report.clauses && report.clauses.length > 0) {
        report.clauses.forEach(clause => {
            const card = document.createElement('div');
            card.className = 'clause-card';
            
            const cNum = String(clause.clause_number);

            // Risk Badge
            let riskCategory = "Low Risk";
            let badgeColor = "var(--low-risk)"; 
            try {
                const riskData = clause.risk_assessment;
                if (riskData && riskData.category) {
                    riskCategory = riskData.category;
                    if (riskCategory.toLowerCase().includes("high")) badgeColor = "var(--high-risk)";
                    else if (riskCategory.toLowerCase().includes("mid")) badgeColor = "var(--mid-risk)";
                    else if (riskCategory.toLowerCase().includes("low")) badgeColor = "var(--low-risk)";
                }
            } catch (e) {
                console.error("Risk parsing error", e);
            }

            // Illegal Badge logic
            const isIllegal = clause.legality_analysis?.is_illegal === true;
            
            let badgesHtml = `<span class="risk-badge" style="background-color: ${badgeColor}">${riskCategory}</span>`;
            if (isIllegal) {
                badgesHtml = `<span class="illegal-badge">⚠️ ILLEGAL</span>` + badgesHtml;
            }

            // Advice
            const explanation = clause.advisory?.short_explanation || "No simple explanation provided.";
            const alternative = clause.advisory?.suggested_alternative_clause || "No alternative provided.";

            // Construct the Audit Trail HTML
            let auditHtml = '';
            if (auditByClause[cNum] && auditByClause[cNum].length > 0) {
                const entries = auditByClause[cNum].map(log => `
                    <div class="audit-entry">
                        <div class="audit-statute">⚖️ ${log.statute_name} (Section ${log.section_number})</div>
                        <div class="audit-reason">${log.violation_reason}</div>
                    </div>
                `).join('');
                
                auditHtml = `
                    <div class="audit-trail">
                        <h4>Statutory Audit Trail</h4>
                        ${entries}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="clause-header">
                    <h3>Clause ${clause.clause_number}</h3>
                    <div class="badges">${badgesHtml}</div>
                </div>
                <div class="clause-body">
                    <div class="original-text">${clause.original_text || 'No text found'}</div>
                    
                    <div class="advice-section">
                        <div class="explanation-box">
                            <h4>Simplified Explanation</h4>
                            <p>${explanation}</p>
                        </div>
                        <div class="alternative-box">
                            <h4>Suggested Alternative</h4>
                            <p class="alternative-text">${alternative}</p>
                        </div>
                    </div>
                    
                    ${auditHtml}
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = "<p>No clauses were successfully extracted.</p>";
    }
}
