// Theme Toggle
document.querySelector('.theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode');
});

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
        uploadLabel.style.color = 'var(--text-main)';
    }
});

let pollInterval;

function updatePipelineUI(currentStep, message) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) statusEl.textContent = message || "Processing...";
    
    for(let i=1; i<=7; i++) {
        const node = document.getElementById(`node-${i}`);
        if (!node) continue;
        node.classList.remove('active', 'completed');
        if (i < currentStep) node.classList.add('completed');
        else if (i === currentStep) node.classList.add('active');
    }
    
    const connectors = document.querySelectorAll('.connector');
    connectors.forEach((conn, idx) => {
        const step = idx + 1;
        conn.classList.remove('active', 'completed');
        if (step < currentStep - 1) conn.classList.add('completed');
        else if (step === currentStep - 1) conn.classList.add('active');
    });
}

// Example Agreements Logic
const RENTAL_AGREEMENT = `LEAVE AND LICENSE AGREEMENT

This Leave and License Agreement ("Agreement") is made at Mumbai, Maharashtra on 15 March 2025

BETWEEN

Mr. Rajesh Sharma, residing at 101, Palm Court, Juhu, Mumbai 400049 (hereinafter referred to as the "Licensor")

AND

Mr. Vikram Singh, residing at Flat 402, Sea View Apartments, Andheri West, Mumbai 400053 (hereinafter referred to as the "Licensee")

1. GRANT OF LICENSE
1.1 The Licensor hereby grants the Licensee a revocable leave and license to occupy and use Flat 402, Sea View Apartments, Andheri West (the "Licensed Premises") strictly for residential purposes for a period of eleven (11) months commencing from 1 April 2025.

2. LICENSE FEE AND DEPOSIT
2.1 The Licensee shall pay a monthly license fee of Rs. 60,000 (Rupees Sixty Thousand only) in advance on or before the 5th day of each month. 
2.2 In the event of any delay in payment of the license fee, the Licensee shall be liable to pay a penal interest of 2% per day on the outstanding amount from the due date until actual payment.
2.3 The Licensee has paid an interest-free security deposit of Rs. 3,00,000 (Rupees Three Lakhs only). The Licensor shall refund this deposit at the time of vacating, subject to deductions for unpaid rent, electricity bills, and any damages to the premises. The Licensor's assessment of damages and repair costs shall be final and binding on the Licensee without requirement of producing repair invoices.

3. LOCK-IN PERIOD
3.1 Both parties agree to a strict lock-in period of eleven (11) months. The Licensee cannot terminate this Agreement before the expiry of the lock-in period.
3.2 If the Licensee vacates the premises before the expiry of the lock-in period, the entire security deposit of Rs. 3,00,000 shall stand entirely forfeited, and the Licensee shall additionally be liable to pay the license fee for the remaining unexpired months of the lock-in period.

4. MAINTENANCE AND REPAIRS
4.1 The Licensee shall be solely responsible for all maintenance and repairs of the Licensed Premises, including structural repairs, plumbing, electrical wiring, and appliance replacement, regardless of whether the damage is due to regular wear and tear or pre-existing defects.

5. INSPECTION AND ACCESS
5.1 The Licensor or his authorized agents shall have the right to enter and inspect the Licensed Premises at any time of the day or night without any prior notice to the Licensee, to ensure the premises are being used in accordance with this Agreement.

6. TERMINATION AND EVICTION
6.1 Notwithstanding anything contained herein, the Licensor reserves the absolute right to terminate this Agreement at any time during the license period by giving twenty-four (24) hours' written notice to the Licensee, without assigning any reason.
6.2 Upon termination or expiry of this Agreement, if the Licensee fails to vacate the premises, the Licensor shall have the absolute right to disconnect essential services (including electricity and water supply) and to physically enter the premises, remove the Licensee's belongings, and change the locks, without requiring any order from a Court of Law. The Licensee hereby waives all rights to object to such action.

7. DISPUTE RESOLUTION
7.1 Any dispute arising out of this Agreement shall be subject to the exclusive jurisdiction of the courts at Mumbai. The Licensee agrees to indemnify the Licensor for all legal costs incurred by the Licensor in enforcing the terms of this Agreement, regardless of the outcome of any legal proceedings.`;

const EMPLOYMENT_AGREEMENT = `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made at Pune, Maharashtra on 14 March 2025

BETWEEN

NIMBUS SYSTEMS PRIVATE LIMITED, a company incorporated under the Companies Act, 2013, having its registered office at Unit 408, Vayu Tech Park, Baner Road, Pune 411045 (hereinafter "the Company", which expression shall include its successors, affiliates and assigns)

AND

Ms. Ananya Rane, daughter of Mr. S. Rane, residing at Flat 12B, Shantiniketan Residency, Kothrud, Pune 411038 (hereinafter "the Employee")

The Company and the Employee are together referred to as the "Parties".

1. DEFINITIONS

1.1 "Confidential Information" means any information relating to the Company, its affiliates, clients, prospective clients, vendors or employees, in any form, whether or not marked confidential, including but not limited to technical data, source code, designs, customer lists, pricing information, business plans, and any information which the Company may at any time designate as confidential.

1.2 "Competing Business" means any business which develops, markets, sells or supports software, data services, consulting or any technology-enabled service.

1.3 "Company Group" means the Company, its holding company, subsidiaries, affiliates and any entity in which the Company holds an interest.

1.4 "Work Product" means all inventions, designs, software, documentation, processes, improvements, know-how and other works conceived, created or reduced to practice by the Employee, whether alone or with others.

2. APPOINTMENT AND TERM

2.1 The Company appoints the Employee to the position of Senior Software Engineer with effect from 1 April 2025.

2.2 The Employee shall serve a probation period of six (6) months from the date of joining. The Company may, at its sole discretion, extend the probation period by such further period as it deems fit, without limit, and the Employee shall be deemed to remain on probation until confirmed in writing.

2.3 Notwithstanding anything else contained in this Agreement, the Employee's employment is subject to the Company's Employee Handbook, HR policies and any circulars issued from time to time, which the Company may amend at its sole discretion without prior notice to or consent of the Employee, and which shall form a binding part of this Agreement.

3. DUTIES AND PLACE OF WORK

3.1 The Employee shall devote her whole time and attention to the business of the Company Group and shall perform such duties as may be assigned to her from time to time.

3.2 The Employee may be transferred or deputed to any office, branch, client site or entity of the Company Group at any location in India or abroad, at the Company's discretion, and all relocation costs shall be borne by the Employee.

3.3 The Employee shall be available outside normal working hours as required by project needs. No additional remuneration shall be payable for such additional hours.

4. REMUNERATION

4.1 The Employee shall be paid a gross annual remuneration of Rs. 18,00,000 (Rupees Eighteen Lakhs only), payable monthly in arrears, subject to statutory deductions.

4.2 Of the gross annual remuneration, an amount of Rs. 2,40,000 is designated as a "Retention Component". The Retention Component shall be withheld and accrued monthly and shall become payable to the Employee only upon completion of twenty-four (24) months of continuous service. If the Employee's employment ends for any reason before completion of twenty-four (24) months, the entire accrued Retention Component shall stand forfeited.

4.3 Any revision of remuneration shall be at the sole discretion of the Company. Nothing in this Agreement entitles the Employee to any increment, bonus or variable payout.

4.4 Performance-linked variable pay, if any, shall be governed by the applicable policy and shall be payable only if the Employee is in employment and has not given or received notice of termination on the date of disbursement.

5. TRAINING AND SERVICE COMMITMENT

5.1 The Company shall provide the Employee with onboarding and technical training during the first ninety (90) days of employment. The Parties agree that the cost of such training to the Company is Rs. 4,00,000.

5.2 In consideration of the training referred to in Clause 5.1, the Employee undertakes to remain in the continuous employment of the Company for a minimum period of twenty-four (24) months from the date of joining ("Service Commitment").

5.3 If the Employee resigns, or her employment is terminated for cause, before completing the Service Commitment, the Employee shall pay to the Company the full training cost of Rs. 4,00,000 as liquidated damages, together with an amount equal to three (3) months' gross remuneration. The Employee authorises the Company to adjust such amounts against any dues, including salary, reimbursements and the Retention Component.

6. LEAVE

6.1 The Employee shall be entitled to eighteen (18) days of paid leave per calendar year, accruing monthly, subject to approval by the reporting manager.

6.2 Unutilised leave shall lapse at the end of each calendar year and shall not be carried forward or encashed.

7. TERMINATION

7.1 The Company may terminate this Agreement at any time by giving the Employee thirty (30) days' written notice, or payment of salary in lieu of notice, without assigning any reason.

7.2 The Employee may resign by giving the Company ninety (90) days' written notice in writing. The Company may, at its sole discretion, require the Employee to serve the full notice period and shall not be obliged to accept payment in lieu of notice from the Employee.

7.3 The Company may terminate this Agreement with immediate effect and without notice or payment in lieu of notice in the event of misconduct, unsatisfactory performance, breach of any Company policy, or loss of confidence in the Employee, as determined by the Company.

7.4 Upon cessation of employment, the Employee shall return all Company property. The Company shall release the Employee's final settlement, experience letter and relieving letter after completion of internal clearance formalities.

8. CONFIDENTIALITY AND INTELLECTUAL PROPERTY

8.1 The Employee shall not, during employment or at any time thereafter, disclose or use any Confidential Information for any purpose other than the performance of her duties.

8.2 All Work Product created by the Employee at any time during the period of employment, whether or not created using Company resources, within or outside working hours, and whether or not related to the business of the Company Group, shall vest absolutely in the Company. The Employee hereby assigns all present and future rights in the Work Product to the Company and waives all moral rights therein.

8.3 The Employee consents to the Company collecting, processing, storing and transferring her personal data, including biometric records, device activity, communications on Company systems and location data, within or outside India, and to sharing such data with the Company Group and its service providers for any business purpose.

9. NON-COMPETE AND NON-SOLICITATION

9.1 For a period of twelve (12) months after cessation of employment for any reason, the Employee shall not be engaged, whether as employee, consultant, director or otherwise, in any Competing Business anywhere in India.

9.2 For a period of twenty-four (24) months after cessation of employment, the Employee shall not solicit, approach or accept business from any client or prospective client of the Company Group, nor solicit any employee of the Company Group.

9.3 The Employee acknowledges that the restrictions in this Clause 9 are reasonable and necessary, and that a breach shall entitle the Company to injunctive relief in addition to damages.

10. LIABILITY AND INDEMNITY

10.1 The Employee shall indemnify and keep indemnified the Company Group against all losses, claims, damages, costs and expenses (including legal costs) arising from any act, omission, negligence or breach of this Agreement by the Employee. This indemnity is unlimited in amount and shall survive termination.

10.2 The Company's total liability to the Employee under or in connection with this Agreement, howsoever arising, shall not exceed one (1) month's gross remuneration.

11. DISPUTE RESOLUTION

11.1 Any dispute arising out of or in connection with this Agreement shall be referred to arbitration by a sole arbitrator appointed by the Company. The seat of arbitration shall be Bengaluru. The arbitration shall be conducted in English.

11.2 The costs of arbitration, including the arbitrator's fees, shall be borne equally by the Parties, save that the Employee shall bear the Company's legal costs if the award is in the Company's favour.

11.3 This Agreement shall be governed by the laws of India and the courts at Pune shall have exclusive jurisdiction, subject to Clause 11.1.

12. GENERAL

12.1 This Agreement, together with the Employee Handbook and HR policies referred to in Clause 2.3, constitutes the entire understanding between the Parties and supersedes all prior discussions, offer letters and representations.

12.2 No amendment to this Agreement shall be valid unless made in writing and signed by both Parties, save for amendments to the policies referred to in Clause 2.3.

12.3 If any provision of this Agreement is held unenforceable, the remaining provisions shall continue in full force.

12.4 The Employee confirms that she has read and understood this Agreement and has had the opportunity to seek independent advice.

IN WITNESS WHEREOF the Parties have set their hands on the date first written above.

For NIMBUS SYSTEMS PRIVATE LIMITED
Authorised Signatory

The Employee
Ms. Ananya Rane`;

document.getElementById('btn-example-emp').addEventListener('click', () => {
    textInput.value = EMPLOYMENT_AGREEMENT;
    textInput.focus();
    textInput.scrollTop = 0;
});

document.getElementById('btn-example-rent').addEventListener('click', () => {
    textInput.value = RENTAL_AGREEMENT;
    textInput.focus();
    textInput.scrollTop = 0;
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
    
    // Reset Pipeline UI
    updatePipelineUI(0, "Initializing backend process...");

    // Start Polling
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
            body: formData
        });
        
        clearInterval(pollInterval);
        
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
        clearInterval(pollInterval);
        alert('Error processing document: ' + error.message);
        loadingView.classList.remove('active');
        loadingView.classList.add('hidden');
        landingView.classList.remove('hidden');
        landingView.classList.add('active');
    }
});

function renderResults(data) {
    currentReportData = data;
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
    let cardDelayIndex = 0;

    if (report.clauses && report.clauses.length > 0) {
        report.clauses.forEach((clause, index) => {
            const cNum = String(clause.clause_number);
            
            // 1. Render Left Pane (Document)
            const row = document.createElement('div');
            row.className = 'clause-row';
            row.id = `doc-clause-${cNum}`;
            row.style.animationDelay = `${index * 0.05}s`;
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
                    const logs = auditByClause[cNum].map(l => `${l.statute_name} Section ${l.section_number}`).join(', ');
                    auditHtml = `<div class="audit-box">Citation: ${logs}</div>`;
                }

                const altHtml = alternative && alternative !== 'N/A' ? `<div class="feed-card-alternative">Suggested: "${alternative}"</div>` : '';

                const card = document.createElement('div');
                card.className = `feed-card ${riskClass}`;
                card.style.animationDelay = `${cardDelayIndex * 0.15}s`;
                cardDelayIndex++;
                card.innerHTML = `
                    <h3 class="feed-card-title">${riskCategory}</h3>
                    <p class="feed-card-subtitle">Found by Risk Analyst, Clause ${cNum}</p>
                    <div class="feed-card-text">${explanation}</div>
                    ${altHtml}
                    ${auditHtml}
                    <div class="badge-confirmed">Confirmed</div>
                `;
                
                // Click to highlight document
                card.addEventListener('click', () => {
                    const target = document.getElementById(`doc-clause-${cNum}`);
                    if (target) {
                        // Remove previous highlights
                        document.querySelectorAll('.clause-text.highlight-underline').forEach(el => {
                            el.classList.remove('highlight-underline');
                        });
                        
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const textDiv = target.querySelector('.clause-text');
                        textDiv.classList.add('highlight-underline');
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

// Download Report Logic
document.getElementById('downloadReportBtn').addEventListener('click', () => {
    if (!currentReportData) return;
    const report = currentReportData.report;
    const auditLogs = currentReportData.audit_logs;
    
    let content = "# Contract Analysis Report\n\n";
    
    if (report.clauses) {
        report.clauses.forEach(c => {
            if (c.risk_assessment?.category === "Low Risk") return; // Only show flagged
            
            content += `## Clause ${c.clause_number}: ${c.risk_assessment?.category || 'Flagged'}\n\n`;
            content += `**Original Text:**\n> ${c.original_text.replace(/\n/g, '\n> ')}\n\n`;
            
            const explanation = c.advisory?.short_explanation || c.legality_analysis?.reasoning || "Issue detected.";
            content += `**Issue:** ${explanation}\n\n`;
            
            if (c.advisory?.suggested_alternative_clause && c.advisory.suggested_alternative_clause !== "N/A") {
                content += `**Suggested Alternative:**\n${c.advisory.suggested_alternative_clause}\n\n`;
            }
            
            const logs = auditLogs.filter(l => String(l.clause_number) === String(c.clause_number));
            if (logs.length > 0) {
                content += `**Legal Citations:**\n`;
                logs.forEach(l => {
                    content += `- ${l.statute_name}, Section ${l.section_number}: ${l.violation_reason}\n`;
                });
                content += `\n`;
            }
            
            content += `---\n\n`;
        });
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Synapse_Analysis_Report.md';
    a.click();
    URL.revokeObjectURL(url);
});
