// DOM Elements
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadLabel = document.getElementById('uploadLabel');
const textInput = document.getElementById('textInput');
const analyzeBtn = document.getElementById('analyzeBtn');

const landingView = document.getElementById('landingView');
const loadingView = document.getElementById('loadingView');
const resultsView = document.getElementById('resultsView');

// File Input Trigger
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        uploadLabel.textContent = e.target.files[0].name;
        uploadLabel.style.color = '#ffffff';
    }
});

// Submit Logic
analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const text = textInput.value.trim();
    
    if (!file && !text) {
        alert("Please paste your agreement text or upload a file.");
        return;
    }

    const formData = new FormData();
    if (file) {
        formData.append('file', file);
    } else {
        const blob = new Blob([text], { type: 'text/plain' });
        formData.append('file', blob, 'pasted_contract.txt');
    }

    // Show Loading
    landingView.classList.remove('active');
    landingView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    loadingView.classList.add('active');

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
        
        // Show Results
        loadingView.classList.remove('active');
        loadingView.classList.add('hidden');
        resultsView.classList.remove('hidden');
        resultsView.classList.add('active');
    } catch (error) {
        alert('Error processing document: ' + error.message);
        loadingView.classList.remove('active');
        loadingView.classList.add('hidden');
        landingView.classList.remove('hidden');
        landingView.classList.add('active');
    }
});

function renderResults(data) {
    const report = data.report;
    const auditLogs = data.audit_logs || [];

    // Group audit logs
    const auditByClause = {};
    auditLogs.forEach(log => {
        const cNum = String(log.clause_number);
        if (!auditByClause[cNum]) auditByClause[cNum] = [];
        auditByClause[cNum].push(log);
    });

    const docPane = document.getElementById('docPane');
    const feedContainer = document.getElementById('feedContainer');
    
    docPane.innerHTML = '';
    feedContainer.innerHTML = '';

    let highCount = 0, medCount = 0, lowCount = 0;

    if (report.clauses && report.clauses.length > 0) {
        report.clauses.forEach(clause => {
            const cNum = String(clause.clause_number);
            
            // 1. Render Left Pane (Document)
            const row = document.createElement('div');
            row.className = 'clause-row';
            row.id = `doc-clause-${cNum}`;
            row.innerHTML = `
                <div class="clause-num">§${cNum}</div>
                <div class="clause-text">${clause.original_text || ''}</div>
            `;
            docPane.appendChild(row);

            // Analyze Risk Level
            let riskCategory = "Low Risk";
            let riskClass = "risk-low";
            
            const isIllegal = clause.legality_analysis?.is_illegal === true;
            
            if (isIllegal) {
                riskCategory = "Illegal / Void";
                riskClass = "risk-illegal";
                highCount++;
            } else {
                try {
                    const r = clause.risk_assessment?.category || "";
                    if (r.toLowerCase().includes("high")) { riskCategory = "High Risk"; riskClass = "risk-high"; highCount++; }
                    else if (r.toLowerCase().includes("mid") || r.toLowerCase().includes("medium")) { riskCategory = "Medium Risk"; riskClass = "risk-medium"; medCount++; }
                    else { riskCategory = "Low Risk"; riskClass = "risk-low"; lowCount++; }
                } catch(e) {}
            }

            // 2. Render Right Pane (Findings Feed)
            // Skip low risk clauses from the feed to keep it uncluttered like the screenshot
            if (riskClass !== 'risk-low') {
                const explanation = clause.advisory?.short_explanation || clause.legality_analysis?.reasoning || "Issue detected.";
                const alternative = clause.advisory?.suggested_alternative_clause || "";
                
                let auditHtml = '';
                if (auditByClause[cNum] && auditByClause[cNum].length > 0) {
                    const logs = auditByClause[cNum].map(l => `${l.statute_name} §${l.section_number}`).join(', ');
                    auditHtml = `<div class="audit-box">⚖️ Cited: ${logs}</div>`;
                }

                const altHtml = alternative && alternative !== 'N/A' ? `<div class="feed-card-alternative">Suggested: "${alternative}"</div>` : '';

                const card = document.createElement('div');
                card.className = `feed-card ${riskClass}`;
                card.innerHTML = `
                    <h3 class="feed-card-title">${riskCategory}</h3>
                    <p class="feed-card-subtitle">Found by Risk Analyst</p>
                    <div class="feed-card-text">${explanation}</div>
                    ${altHtml}
                    ${auditHtml}
                    <div class="badge-confirmed">✓ Confirmed</div>
                `;
                
                // Click to highlight document
                card.addEventListener('click', () => {
                    const target = document.getElementById(`doc-clause-${cNum}`);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const textDiv = target.querySelector('.clause-text');
                        textDiv.style.color = '#ffffff';
                        textDiv.style.fontWeight = 'bold';
                        setTimeout(() => {
                            textDiv.style.color = '#e5e7eb';
                            textDiv.style.fontWeight = 'normal';
                        }, 1500);
                    }
                });

                feedContainer.appendChild(card);
            }
        });
    }

    // Update Headers
    const totalIssues = highCount + medCount;
    document.getElementById('issueCount').textContent = totalIssues;
    document.getElementById('riskLevelTitle').textContent = totalIssues > 0 ? "Risky." : "Clear.";
    
    document.getElementById('countHigh').textContent = highCount;
    document.getElementById('countMedium').textContent = medCount;
    document.getElementById('countLow').textContent = lowCount;
    
    // Calculate dummy score out of 100
    const score = Math.max(0, 100 - (highCount * 15) - (medCount * 5));
    document.getElementById('riskScore').textContent = score;
}
