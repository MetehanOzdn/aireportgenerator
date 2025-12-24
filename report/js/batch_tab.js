(function () {
    // State
    const batchState = {
        cases: [], // Array of { id, name, audioFile, truthFile, templateId, status, result: { report: '', transcript: '' } }
        isProcessing: false
    };

    // UI Elements
    const ui = {
        folderInput: document.getElementById('batch-folder-input'),
        folderName: document.getElementById('batch-folder-name'),
        tableBody: document.getElementById('batch-list-body'),
        modal: document.getElementById('batch-details-modal'),
        modalContent: document.getElementById('batch-modal-content'),
        closeModal: document.querySelector('.close-modal')
    };

    // Initialize
    function init() {
        if (ui.folderInput) {
            ui.folderInput.addEventListener('change', handleFolderSelect);
        }
        if (ui.closeModal) {
            ui.closeModal.addEventListener('click', () => ui.modal.classList.add('hidden'));
        }
        // Close modal on click outside
        window.addEventListener('click', (e) => {
            if (e.target === ui.modal) ui.modal.classList.add('hidden');
        });
    }

    // Handle Folder Selection
    async function handleFolderSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Group files by parent directory
        const casesMap = new Map();

        // Helper to get case ID from path (parent folder name)
        // Path structure: CaseFolder/file.ext -> CaseFolder is the key
        // Note: webkitRelativePath gives "Folder/Subfolder/file.ext"

        files.forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            // Expecting depth. If simple "Folder/file", parent is Folder.
            // If "Root/Case1/file", parent is Case1.
            // Let's use the immediate parent folder name as the case identifier.
            if (pathParts.length < 2) return; // File at root, maybe ignore or handle differently

            const fileName = pathParts[pathParts.length - 1];
            const parentFolder = pathParts[pathParts.length - 2];
            // fullPath key to ensure uniqueness if multiple folders have same name? 
            // Better use the path up to the file
            const casePath = pathParts.slice(0, pathParts.length - 1).join('/');

            if (!casesMap.has(casePath)) {
                casesMap.set(casePath, {
                    id: Math.random().toString(36).substr(2, 9),
                    name: parentFolder,
                    path: casePath,
                    audioFile: null,
                    truthFile: null,
                    templateId: '',
                    status: 'pending', // pending, running, completed, error
                    result: null
                });
            }

            const caseObj = casesMap.get(casePath);

            if (file.name.endsWith('.webm') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
                caseObj.audioFile = file;
            } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                caseObj.truthFile = file;
            }
        });

        // Filter out valid cases (must have at least audio)
        // User requirements say "folder structure: audio + truth". 
        // We'll require audio at minimum. Truth is optional but preferred for comparison.
        batchState.cases = Array.from(casesMap.values())
            .filter(c => c.audioFile)
            .sort((a, b) => a.name.localeCompare(b.name));

        ui.folderName.textContent = `${batchState.cases.length} cases found in selected folder`;
        renderTable();
    }

    // Render Table
    function renderTable() {
        ui.tableBody.innerHTML = '';

        if (batchState.cases.length === 0) {
            ui.tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">No valid cases found (Audio files required).</td></tr>';
            return;
        }

        batchState.cases.forEach(c => {
            const tr = document.createElement('tr');

            // Status Badge
            const statusClass = `status-${c.status}`;
            const statusLabel = c.status.toUpperCase();

            // Template Options
            // We need to flatten the REPORT_TEMPLATES to get options
            // This is a bit expensive to regenerate every row, but for <100 cases ok.
            // Optimization: Generate options string once.

            tr.innerHTML = `
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>${c.name}<br><span style="font-size:0.7em; opacity:0.7">${c.path}</span></td>
                <td>${c.audioFile.name}</td>
                <td>
                    <select class="batch-template-select" data-id="${c.id}" style="width: 150px; padding: 5px; border-radius: 4px; border: 1px solid #333; background: #000; color: white;">
                        <option value="">Select Template</option>
                        ${getTemplateOptions(c.templateId)}
                    </select>
                </td>
                <td>${c.truthFile ? '✅ ' + c.truthFile.name : '❌ Missing'}</td>
                <td>
                    <button class="table-btn btn-run" onclick="window.runBatchCase('${c.id}')" ${c.status === 'running' ? 'disabled' : ''}>
                        ${c.status === 'running' ? 'Running...' : 'Run'}
                    </button>
                    <button class="table-btn btn-details" onclick="window.showBatchDetails('${c.id}')" ${c.status === 'completed' ? '' : 'disabled'}>
                        Details
                    </button>
                </td>
            `;
            ui.tableBody.appendChild(tr);

            // Bind change event manually for the select (onclick is inline for buttons for simplicity but event delegation better)
            const select = tr.querySelector('.batch-template-select');
            select.addEventListener('change', (e) => {
                c.templateId = e.target.value;
            });
        });
    }

    // Global helper for template options
    let cachedTemplateOptions = null;
    function getTemplateOptions(selectedId) {
        if (!cachedTemplateOptions) {
            // Flatten templates
            let opts = '';
            // Check if globally available
            if (typeof REPORT_TEMPLATES !== 'undefined') {
                for (const [group, templates] of Object.entries(REPORT_TEMPLATES)) {
                    opts += `<optgroup label="${group}">`;
                    // Fix: Iterate over object values/entries, not array
                    for (const [name, content] of Object.entries(templates)) {
                        // Use a composite ID since templates don't have IDs
                        const id = `${group}::${name}`;
                        opts += `<option value="${id}">${name}</option>`;
                    }
                    opts += `</optgroup>`;
                }
            } else {
                console.warn("REPORT_TEMPLATES is not defined.");
            }
            cachedTemplateOptions = opts;
        }
        // Inject selected attribute
        if (selectedId) {
            return cachedTemplateOptions.replace(`value="${selectedId}"`, `value="${selectedId}" selected`);
        }
        return cachedTemplateOptions;
    }

    // Process Case (Gemini Integration)
    window.runBatchCase = async function (caseId) {
        const c = batchState.cases.find(x => x.id === caseId);
        if (!c) return;

        // Validation
        const apiKey = document.getElementById('gemini-api-key').value;
        const model = document.getElementById('gemini-model-select').value;

        if (!apiKey) {
            alert('Please enter Google API Key in the header first.');
            return;
        }
        if (!c.templateId) {
            alert('Please select a template for this case.');
            return;
        }

        // Get template content
        let templateContent = "";
        if (c.templateId && c.templateId.includes('::')) {
            const [group, name] = c.templateId.split('::');
            if (REPORT_TEMPLATES[group] && REPORT_TEMPLATES[group][name]) {
                templateContent = REPORT_TEMPLATES[group][name];
            }
        }

        // Update Status
        c.status = 'running';
        renderTable(); // Refresh UI

        try {
            // Helpers from gemini_tab.js (We need to duplicate base64 logic or expose it)
            // Let's implement simple fileToBase64 here
            const base64Audio = await fileToBase64(c.audioFile);

            // API Call logic (Reused from gemini_tab.js)
            let mimeType = c.audioFile.type;
            if (mimeType === 'video/webm' || !mimeType) mimeType = 'audio/webm';
            if (mimeType === 'audio/mp3') mimeType = 'audio/mp3';

            // Step 1: Transcribe
            const transcriptPayload = {
                contents: [{
                    parts: [
                        { text: "Transcribe this medical audio strictly verbatim. Output only the transcription text." },
                        { inline_data: { mime_type: mimeType, data: base64Audio } }
                    ]
                }]
            };

            // API Version Logic
            const isExperimental = model.includes('exp') || model.includes('thinking') || model.startsWith('gemini-2.');
            const apiVersion = isExperimental ? 'v1beta' : 'v1';

            const transcriptUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

            // Fetch Transcript
            const tResp = await fetch(transcriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transcriptPayload)
            });
            if (!tResp.ok) throw new Error((await tResp.json()).error?.message || tResp.statusText);
            const tData = await tResp.json();
            const transcript = tData.candidates?.[0]?.content?.parts?.[0]?.text || "No transcript";

            // Step 2: Generate Report
            const systemPrompt = `You are an expert radiologist assistant. Fill the template based on the transcript.
IMPORTANT:
1. Transcript may contain ASR errors. Infer and correct them.
2. Maintain professional medical tone.
3. Output ONLY the filled report.`;

            const reportPrompt = `TEMPLATE:\n${templateContent}\n\nTRANSCRIPT:\n${transcript}\n\nFILLED REPORT:`;

            const reportPayload = {
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: reportPrompt }] }]
            };

            const reportUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
            const rResp = await fetch(reportUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });
            if (!rResp.ok) throw new Error((await rResp.json()).error?.message || rResp.statusText);
            const rData = await rResp.json();
            const reportText = rData.candidates?.[0]?.content?.parts?.[0]?.text || "No report output";

            // Success
            c.status = 'completed';
            c.result = {
                transcript: transcript,
                report: reportText
            };

        } catch (err) {
            console.error(err);
            c.status = 'error';
            c.result = { error: err.message };
        } finally {
            renderTable();
        }
    };

    // Show Details
    window.showBatchDetails = function (caseId) {
        const c = batchState.cases.find(x => x.id === caseId);
        if (!c || !c.result) return;

        // Create Object URL for audio playback if file exists
        const audioUrl = c.audioFile ? URL.createObjectURL(c.audioFile) : null;

        let contentHtml = `
            <div style="display:flex; flex-direction:column; gap:1.5rem; height:100%;">
                
                <!-- Section 1: Audio & Transcript -->
                <div style="background:rgba(0,0,0,0.3); padding:1rem; border-radius:8px; flex-shrink:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="margin:0;">Audio & Transcript</h3>
                        ${audioUrl ? `<audio controls src="${audioUrl}" style="height:32px;"></audio>` : '<span>No Audio</span>'}
                    </div>
                    <div style="white-space:pre-wrap; font-size:0.9rem; max-height:150px; overflow-y:auto; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem;">${c.result.transcript}</div>
                </div>

                <!-- Section 2: Comparison (Fills remaining space) -->
                <div style="background:rgba(0,0,0,0.3); padding:1rem; border-radius:8px; flex:1; display:flex; flex-direction:column; overflow:hidden;">
                     <h3 style="margin-top:0; margin-bottom:1rem;">Comparison Analysis</h3>
                     <div id="batch-diff-container" style="flex:1; overflow:hidden;">Generating diff...</div>
                </div>
            </div>
        `;
        ui.modalContent.innerHTML = contentHtml;
        ui.modal.classList.remove('hidden');

        // Generate Diff async
        setTimeout(() => {
            const container = document.getElementById('batch-diff-container');
            if (c.truthFile) {
                // Read truth file on demand if not already loaded string? 
                // Using FileReader here might be async. 
                // Let's read it now.
                const reader = new FileReader();
                reader.onload = (e) => {
                    const truthText = e.target.result;
                    if (typeof diff_match_patch !== 'undefined') {
                        const dmp = new diff_match_patch();
                        const diffs = dmp.diff_main(truthText, c.result.report);
                        dmp.diff_cleanupSemantic(diffs);
                        // Reuse side-by-side generator logic (simplified here inline or copy function)
                        container.innerHTML = generateSideBySideDiffSimple(diffs);
                    } else {
                        container.textContent = "Diff library not loaded.";
                    }
                };
                reader.readAsText(c.truthFile);
            } else {
                container.innerHTML = `<div style="padding:1rem">No truth file provided for comparison.<br><br><strong>Generated Report:</strong><br>${c.result.report}</div>`;
            }
        }, 100);
    };

    // Helper: File to Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // Helper: Simple Diff Gen (Copy from gemini_tab.js logic but simplified)
    function generateSideBySideDiffSimple(diffs) {
        let truthHTML = '';
        let generatedHTML = '';

        diffs.forEach(part => {
            const type = part[0];
            const text = part[1];
            const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            if (type === 0) { // Equal
                truthHTML += `<span class="diff-text-equal">${esc}</span>`;
                generatedHTML += `<span class="diff-text-equal">${esc}</span>`;
            } else if (type === 1) { // Insert (Generated)
                generatedHTML += `<span class="diff-text-added" title="Added">${esc}</span>`;
            } else if (type === -1) { // Delete (Truth)
                truthHTML += `<span class="diff-text-missing" title="Missing">${esc}</span>`;
            }
        });

        return `
            <div class="comparison-container" style="height:100%; display:flex;">
                <div class="comparison-box"><div class="box-header">Truth Report (Reference)</div><div class="box-content">${truthHTML}</div></div>
                <div class="comparison-box"><div class="box-header">Gemini Report (Generated)</div><div class="box-content">${generatedHTML}</div></div>
            </div>
        `;
    }

    // Init on load
    document.addEventListener('DOMContentLoaded', init);

})();
