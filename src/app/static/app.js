// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const landingView = document.getElementById('landingView');
const loadingView = document.getElementById('loadingView');
const resultsView = document.getElementById('resultsView');
const analyzeBtn = document.getElementById('analyzeBtn');
const textInput = document.getElementById('textInput');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileChip = document.getElementById('fileChip');
const dropZoneContent = document.getElementById('dropZoneContent');
const cancelBtn = document.getElementById('cancelBtn');

// State
let currentReportData = null;
let pollInterval = null;
let timerInterval = null;
let abortController = null;
let selectedFile = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.documentElement.classList.add('light-mode');
    }
    
    // Load persisted analysis
    const savedAnalysis = localStorage.getItem('lastAnalysis');
    if (savedAnalysis) {
        try {
            renderResults(JSON.parse(savedAnalysis));
            landingView.classList.replace('active', 'hidden');
            resultsView.classList.replace('hidden', 'active');
        } catch(e) {}
    }
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('theme', document.documentElement.classList.contains('light-mode') ? 'light' : 'dark');
});

// Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
});
document.getElementById('removeFileBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = "";
    fileChip.classList.add('hidden');
    dropZoneContent.classList.remove('hidden');
});

function handleFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert("File is too large (max 10MB).");
        return;
    }
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    dropZoneContent.classList.add('hidden');
    fileChip.classList.remove('hidden');
}

// Example Agreements
const RENTAL_AGREEMENT = `LEAVE AND LICENSE AGREEMENT... (Sample Loaded)`; // Keep short for preview, will load full if clicked
document.getElementById('btn-example-emp').addEventListener('click', () => {
    textInput.value = "EMPLOYMENT AGREEMENT\n\nThis Employment Agreement is entered into by XYZ Tech and Jane Smith...\n1. COMPENSATION: Base salary $120,000.\n2. NON-COMPETE: Employee agrees not to work for any competitor for 5 years worldwide.";
});
document.getElementById('btn-example-rent').addEventListener('click', () => {
    textInput.value = "LEAVE AND LICENSE AGREEMENT\n\n1. RENT: Rs. 60,000 per month.\n2. EVICTION: Licensor can evict without notice and seize property.";
});

// Analyze
analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!selectedFile && text.length < 20) {
        alert("Please upload a contract or paste sufficient text (min 20 characters).");
        return;
    }

    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    else formData.append('file', new Blob([text], { type: 'text/plain' }), 'pasted.txt');

    abortController = new AbortController();

    // UI Transition
    landingView.classList.replace('active', 'hidden');
    resultsView.classList.replace('active', 'hidden');
    loadingView.classList.replace('hidden', 'active');
    
    // Timer
    let seconds = 0;
    const timerEl = document.getElementById('loadingTimer');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        timerEl.textContent = `${seconds}s elapsed (Expected: ~45s)`;
    }, 1000);
    
    updatePipelineUI(0, "Initializing backend process...");

    pollInterval = setInterval(async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            updatePipelineUI(data.step, data.message);
        } catch(e) {}
    }, 800);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
            signal: abortController.signal
        });
        
        clearInterval(pollInterval);
        clearInterval(timerInterval);
        
        if (!response.ok) throw new Error('Analysis failed on the server. Please try again.');
        
        const data = await response.json();
        localStorage.setItem('lastAnalysis', JSON.stringify(data));
        renderResults(data);
        
        loadingView.classList.replace('active', 'hidden');
        resultsView.classList.replace('hidden', 'active');
    } catch (error) {
        clearInterval(pollInterval);
        clearInterval(timerInterval);
        if (error.name === 'AbortError') alert("Analysis cancelled.");
        else alert('Error processing document: ' + error.message);
        
        loadingView.classList.replace('active', 'hidden');
        landingView.classList.replace('hidden', 'active');
    }
});

cancelBtn.addEventListener('click', () => {
    if (abortController) abortController.abort();
});

document.getElementById('newAnalysisBtn').addEventListener('click', () => {
    localStorage.removeItem('lastAnalysis');
    resultsView.classList.replace('active', 'hidden');
    landingView.classList.replace('hidden', 'active');
    textInput.value = '';
    document.getElementById('removeFileBtn').click();
});

function updatePipelineUI(currentStep, message) {
    const statusEl = document.getElementById('loadingStatus');
    const stepMsgs = {
        1: "Parsing document text...", 2: "Segmenting clauses...", 3: "Retrieving statutes (RAG)...",
        4: "Checking legality...", 5: "Assessing risks...", 6: "Drafting alternatives...", 7: "Validating..."
    };
    if (statusEl) statusEl.textContent = stepMsgs[currentStep] || message || "Processing...";
    
    for(let i=1; i<=7; i++) {
        const node = document.getElementById(`node-${i}`);
        if (!node) continue;
        node.classList.remove('active', 'completed');
        if (i < currentStep) node.classList.add('completed');
        else if (i === currentStep) node.classList.add('active');
    }
    document.querySelectorAll('.connector').forEach((conn, idx) => {
        const step = idx + 1;
        conn.classList.remove('active', 'completed');
        if (step < currentStep - 1) conn.classList.add('completed');
        else if (step === currentStep - 1) conn.classList.add('active');
    });
}

// Render Results
let currentActiveFilters = { high: true, medium: true, low: false };

function renderResults(data) {
    currentReportData = data;
    const report = data.report;
    const auditLogs = data.audit_logs || [];

    const docPane = document.getElementById('docPane');
    const feedContainer = document.getElementById('feedContainer');
    docPane.innerHTML = ''; feedContainer.innerHTML = '';

    let highCount = 0, medCount = 0, lowCount = 0;
    
    const auditByClause = {};
    auditLogs.forEach(l => {
        const cNum = String(l.clause_number);
        if (!auditByClause[cNum]) auditByClause[cNum] = [];
        auditByClause[cNum].push(l);
    });

    if (report.clauses) {
        // Pre-compute risk severity
        report.clauses.forEach(clause => {
            const isIllegal = clause.legality_analysis?.is_illegal;
            const r = (clause.risk_assessment?.category || "").toLowerCase();
            if (isIllegal || r.includes('high')) { clause._risk = 'high'; highCount++; }
            else if (r.includes('med') || r.includes('mod')) { clause._risk = 'medium'; medCount++; }
            else { clause._risk = 'low'; lowCount++; }
        });

        // Sort for feed: High -> Med -> Low -> Original Order
        const sortedClauses = [...report.clauses].sort((a, b) => {
            const weight = { 'high': 3, 'medium': 2, 'low': 1 };
            const diff = weight[b._risk] - weight[a._risk];
            return diff !== 0 ? diff : a.clause_number - b.clause_number;
        });

        // Render Doc Pane (Original Order)
        report.clauses.forEach((clause, i) => {
            const cNum = String(clause.clause_number);
            const row = document.createElement('div');
            row.className = 'clause-row';
            row.id = `doc-clause-${cNum}`;
            row.style.animationDelay = `${i * 0.05}s`;
            row.innerHTML = `<div class="clause-num">§${cNum}</div><div class="clause-text" id="text-clause-${cNum}">${clause.original_text}</div>`;
            
            // Link back to feed
            row.addEventListener('click', () => {
                const card = document.getElementById(`card-clause-${cNum}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.transform = 'scale(1.02)';
                    card.style.borderColor = 'var(--text-main)';
                    setTimeout(() => { card.style.transform = ''; card.style.borderColor = ''; }, 600);
                }
            });
            docPane.appendChild(row);
        });

        // Render Feed Pane (Sorted)
        let delayIdx = 0;
        sortedClauses.forEach(clause => {
            const cNum = String(clause.clause_number);
            const rClass = clause._risk;
            
            const card = document.createElement('div');
            card.className = `feed-card risk-${rClass}`;
            card.id = `card-clause-${cNum}`;
            card.dataset.risk = rClass;
            card.style.animationDelay = `${delayIdx++ * 0.1}s`;
            
            if (!currentActiveFilters[rClass]) card.classList.add('hidden');

            const titleHint = clause.original_text.split(' ').slice(0, 6).join(' ') + '...';
            const exp = clause.advisory?.short_explanation || clause.legality_analysis?.reasoning || "Issue detected.";
            const alt = clause.advisory?.suggested_alternative_clause;
            
            let auditHtml = '';
            if (auditByClause[cNum]) {
                const logs = auditByClause[cNum].map(l => {
                    let sec = (l.section_number || '').replace(/Section\s+/ig, '').trim().replace(/\(implicitly\)/ig, '').trim();
                    return `${l.statute_name}, Sec ${sec}`;
                }).join('; ');
                auditHtml = `<div class="audit-box">Citation: ${logs}</div>`;
            }

            let suggestHtml = '';
            if (alt && alt !== 'N/A') {
                suggestHtml = `
                    <div class="suggestion-box">
                        <div class="suggestion-tabs">
                            <button class="tab-btn active" onclick="this.parentElement.nextElementSibling.textContent = \`${alt.replace(/`/g, "'")}\`; this.nextElementSibling.classList.remove('active'); this.classList.add('active');">Suggested</button>
                            <button class="tab-btn" onclick="this.parentElement.nextElementSibling.textContent = \`${clause.original_text.replace(/`/g, "'")}\`; this.previousElementSibling.classList.remove('active'); this.classList.add('active');">Original</button>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${alt.replace(/`/g, "'")}\`); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy',2000);">Copy</button>
                        </div>
                        <div class="suggestion-content">${alt}</div>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3 class="feed-card-title">${rClass === 'high' ? 'High Risk' : rClass === 'medium' ? 'Medium Risk' : 'Low Risk'}</h3>
                <p class="feed-card-subtitle">Clause ${cNum} &middot; ${titleHint}</p>
                <div class="feed-card-text">${exp}</div>
                ${suggestHtml}
                ${auditHtml}
            `;
            
            // Link to Doc
            card.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON') return; // Ignore tab/copy clicks
                const target = document.getElementById(`doc-clause-${cNum}`);
                if (target) {
                    document.querySelectorAll('.clause-text').forEach(el => el.className = 'clause-text');
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('flash');
                    setTimeout(() => target.classList.remove('flash'), 800);
                    const textDiv = document.getElementById(`text-clause-${cNum}`);
                    textDiv.classList.add(`clause-highlight-${rClass}`);
                }
            });

            feedContainer.appendChild(card);
        });
    }

    // Update Headers
    document.getElementById('countHigh').textContent = highCount;
    document.getElementById('countMedium').textContent = medCount;
    document.getElementById('countLow').textContent = lowCount;
    
    const issues = highCount + medCount;
    document.getElementById('resultsTitleText').innerHTML = issues > 0 ? `Risky. <span id="issueCount">${issues}</span> issues found.` : `All clear. <span id="issueCount">0</span> issues found.`;
    
    const penalty = Math.min(100, (highCount * 25) + (medCount * 10)); 
    document.getElementById('riskScore').textContent = penalty;
    const bar = document.getElementById('riskScoreBar');
    bar.style.width = `${penalty}%`;
    bar.style.background = penalty > 60 ? 'var(--dot-red)' : (penalty > 20 ? 'var(--dot-orange)' : 'var(--dot-green)');

    // Setup Filters
    setupFilters();
    
    // Auto-scroll to first visible card
    setTimeout(() => {
        const first = feedContainer.querySelector('.feed-card:not(.hidden)');
        if(first) first.click();
    }, 500);
}

function setupFilters() {
    ['High', 'Medium', 'Low'].forEach(level => {
        const btn = document.getElementById(`filter${level}`);
        const rClass = level.toLowerCase();
        
        // Match initial visual state to logic
        if (currentActiveFilters[rClass]) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.onclick = () => {
            currentActiveFilters[rClass] = !currentActiveFilters[rClass];
            btn.classList.toggle('active', currentActiveFilters[rClass]);
            document.querySelectorAll(`.feed-card.risk-${rClass}`).forEach(card => {
                card.classList.toggle('hidden', !currentActiveFilters[rClass]);
            });
        };
    });
}

// Copy All
document.getElementById('copyAllBtn').addEventListener('click', (e) => {
    if(!currentReportData) return;
    let out = "SUGGESTED REVISIONS:\n\n";
    currentReportData.report.clauses.forEach(c => {
        if(c.advisory?.suggested_alternative_clause && c.advisory.suggested_alternative_clause !== 'N/A') {
            out += `Clause ${c.clause_number}:\n${c.advisory.suggested_alternative_clause}\n\n`;
        }
    });
    navigator.clipboard.writeText(out);
    const orig = e.target.textContent;
    e.target.textContent = "Copied!";
    setTimeout(() => e.target.textContent = orig, 2000);
});

// PDF Generation remains using html2pdf
document.getElementById('downloadReportBtn').addEventListener('click', () => {
    if (!currentReportData) return;
    const container = document.createElement('div');
    container.style.padding = '40px'; container.style.fontFamily = 'Arial';
    
    let html = `<h1 style="color:#0f172a;text-align:center;">FinePrint Analysis Report</h1><hr/><br/>`;
    currentReportData.report.clauses.forEach(c => {
        if(c._risk === 'low') return;
        html += `<h3 style="color:${c._risk==='high'?'red':'orange'}">Clause ${c.clause_number} (${c._risk})</h3>`;
        html += `<p style="background:#f1f5f9;padding:10px;">${c.original_text}</p>`;
        html += `<p><strong>Issue:</strong> ${c.advisory?.short_explanation || "Flagged"}</p>`;
        if(c.advisory?.suggested_alternative_clause) html += `<p><strong>Suggested:</strong> ${c.advisory.suggested_alternative_clause}</p>`;
        html += `<br/>`;
    });
    
    container.innerHTML = html;
    if (window.html2pdf) html2pdf().set({ margin: 0.5, filename: 'FinePrint_Report.pdf' }).from(container).save();
});
