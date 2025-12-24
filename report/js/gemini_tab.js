/**
 * gemini_tab.js
 * Modular implementation for Google Gemini Tab
 */

(function () {
    console.log("Gemini Tab Module Loaded.");

    // State specific to Gemini Tab
    const geminiState = {
        apiKey: '',
        model: 'gemini-2.5-pro',
        audioFile: null,
        templateContent: null,
        truthContent: null
    };

    // DOM Elements specific to Gemini Tab
    const ui = {
        tabBtn: null,
        container: null,
        inputs: {
            apiKey: null,
            model: null,
            audio: null,
            template: null,
            truth: null
        },
        display: {
            audioInfo: null,
            templateInfo: null,
            truthInfo: null
        },
        actions: {
            runBtn: null
        },
        results: {
            transcript: null,
            report: null,
            comparison: null,
            section: null
        }
    };

    /**
     * Initialization of Gemini Module
     */
    function initGemini() {
        // Cache DOM elements
        ui.tabBtn = document.querySelector('button[data-tab="tab-gemini"]');
        ui.container = document.getElementById('tab-gemini');

        if (!ui.container) return; // Tab might not exist yet if HTML isn't updated

        ui.inputs.apiKey = document.getElementById('gemini-api-key');
        ui.inputs.model = document.getElementById('gemini-model-select');
        ui.inputs.audio = document.getElementById('gemini-audio-input');
        ui.inputs.template = document.getElementById('gemini-template-select');
        ui.inputs.truth = document.getElementById('gemini-truth-input');

        ui.display.audioInfo = document.getElementById('gemini-audio-info');
        ui.display.templateInfo = document.getElementById('gemini-template-info');
        ui.display.truthInfo = document.getElementById('gemini-truth-info');

        ui.actions.runBtn = document.getElementById('gemini-run-btn');

        ui.results.section = document.getElementById('gemini-results-section');
        ui.results.transcript = document.getElementById('gemini-output-transcript');
        ui.results.report = document.getElementById('gemini-output-report');
        ui.results.comparison = document.getElementById('gemini-output-comparison');

        bindEvents();
        loadGeminiSettings();
    }

    /**
     * Event Binding
     */
    function bindEvents() {
        // API Key Input
        if (ui.inputs.apiKey) {
            ui.inputs.apiKey.addEventListener('input', (e) => {
                geminiState.apiKey = e.target.value.trim();
                localStorage.setItem('gemini_api_key', geminiState.apiKey);
                updateRunButton();
            });
        }

        // Model Selection
        if (ui.inputs.model) {
            ui.inputs.model.addEventListener('change', (e) => {
                geminiState.model = e.target.value;
                localStorage.setItem('gemini_model', geminiState.model);
            });
        }

        // Audio Input
        const audioZone = document.getElementById('gemini-drop-audio');
        if (audioZone) setupDropZone(audioZone, ui.inputs.audio, 'audio');

        // Template Selection
        if (ui.inputs.template) {
            populateTemplates(ui.inputs.template);
            ui.inputs.template.addEventListener('change', (e) => {
                const val = e.target.value;
                const dropZone = document.getElementById('gemini-drop-template');

                if (!val) {
                    geminiState.templateContent = null;
                    ui.display.templateInfo.textContent = '';
                    if (dropZone) dropZone.classList.remove('has-file');
                } else {
                    const [cat, name] = val.split("::");
                    // Access REPORT_TEMPLATES directly
                    if (typeof REPORT_TEMPLATES !== 'undefined' && REPORT_TEMPLATES[cat]) {
                        geminiState.templateContent = REPORT_TEMPLATES[cat][name];
                        ui.display.templateInfo.textContent = `Seçildi: ${name}`;
                        if (dropZone) dropZone.classList.add('has-file');
                    }
                }
                updateRunButton();
            });
        }

        // Truth Input
        const truthZone = document.getElementById('gemini-drop-truth');
        if (truthZone) setupDropZone(truthZone, ui.inputs.truth, 'truth');

        // Run Button
        if (ui.actions.runBtn) {
            ui.actions.runBtn.addEventListener('click', runGeminiSimulation);
        }
    }

    // Reuse or duplicate utility for modularity
    function setupDropZone(zone, input, type) {
        zone.addEventListener('click', () => input && input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0], type);
        });
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files.length) handleFileSelect(e.target.files[0], type);
            });
        }
    }

    function handleFileSelect(file, type) {
        if (type === 'audio') {
            geminiState.audioFile = file;
            if (ui.display.audioInfo) ui.display.audioInfo.textContent = `${file.name} (${formatSize(file.size)})`;
            document.getElementById('gemini-drop-audio').classList.add('has-file');

            // Show and load audio player
            const audioPlayer = document.getElementById('gemini-audio-player');
            if (audioPlayer) {
                const audioURL = URL.createObjectURL(file);
                audioPlayer.src = audioURL;
                audioPlayer.style.display = 'block';

                // Clean up the URL when audio is loaded or on error
                audioPlayer.onloadeddata = () => console.log('Audio loaded');
                audioPlayer.onerror = () => URL.revokeObjectURL(audioURL);
            }
        } else if (type === 'truth') {
            const reader = new FileReader();
            reader.onload = (e) => {
                geminiState.truthContent = e.target.result;
                if (ui.display.truthInfo) ui.display.truthInfo.textContent = `${file.name}`;
                document.getElementById('gemini-drop-truth').classList.add('has-file');
                updateRunButton();
            };
            reader.readAsText(file);
        }
        updateRunButton();
    }

    function populateTemplates(select) {
        if (typeof REPORT_TEMPLATES === 'undefined') {
            console.warn("REPORT_TEMPLATES not found, retrying in 500ms...");
            setTimeout(() => populateTemplates(select), 500);
            return;
        }

        select.innerHTML = '<option value="">-- Şablon Seçiniz --</option>'; // Reset

        Object.keys(REPORT_TEMPLATES).forEach(cat => {
            const group = document.createElement('optgroup');
            group.label = cat;
            Object.keys(REPORT_TEMPLATES[cat]).forEach(name => {
                const opt = document.createElement('option');
                opt.value = `${cat}::${name}`;
                opt.textContent = name;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    }

    function loadGeminiSettings() {
        const key = localStorage.getItem('gemini_api_key');
        if (key && ui.inputs.apiKey) {
            geminiState.apiKey = key;
            ui.inputs.apiKey.value = key;
        }
        const model = localStorage.getItem('gemini_model');
        if (model && ui.inputs.model) {
            geminiState.model = model;
            ui.inputs.model.value = model;
        }
    }

    function updateRunButton() {
        const ready = geminiState.apiKey && geminiState.audioFile && geminiState.templateContent && geminiState.truthContent;
        if (ui.actions.runBtn) ui.actions.runBtn.disabled = !ready;
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    }

    // --- Core Logic ---

    async function runGeminiSimulation() {
        if (!geminiState.apiKey) return alert("API Key Required");

        setLoading(true);
        try {
            // 1. Prepare Data
            const base64Audio = await fileToBase64(geminiState.audioFile);
            let mimeType = geminiState.audioFile.type;
            // Spoofing per GEMINI_USAGE.md
            if (mimeType === 'video/webm' || !mimeType) mimeType = 'audio/webm';
            if (mimeType === 'audio/mp3') mimeType = 'audio/mp3'; // Ensure standard

            // 2. STEP 1: Transcribe Audio
            updateStatus('Ses metne dönüştürülüyor...');
            const transcriptPayload = {
                contents: [{
                    parts: [
                        { text: "Transcribe this medical audio strictly verbatim. Output only the transcription text." },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Audio
                            }
                        }
                    ]
                }]
            };

            // Determine API version based on model
            // Stable models (1.5 Pro, 1.5 Flash) use v1, experimental models use v1beta
            // Assuming 2.x models are currently beta/experimental
            const isExperimental = geminiState.model.includes('exp') ||
                geminiState.model.includes('thinking') ||
                geminiState.model.startsWith('gemini-2.');

            const apiVersion = isExperimental ? 'v1beta' : 'v1';

            const transcriptUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${geminiState.model}:generateContent?key=${geminiState.apiKey}`;
            const transcriptResponse = await fetch(transcriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transcriptPayload)
            });

            if (!transcriptResponse.ok) {
                const err = await transcriptResponse.json();
                throw new Error(err.error?.message || transcriptResponse.statusText);
            }

            const transcriptData = await transcriptResponse.json();
            const transcript = transcriptData.candidates?.[0]?.content?.parts?.[0]?.text || "No transcript.";

            // Display transcript
            ui.results.section.classList.remove('hidden');
            if (ui.results.transcript) ui.results.transcript.textContent = transcript;

            // 3. STEP 2: Generate Report from Transcript
            updateStatus('Rapor oluşturuluyor...');
            const systemPrompt = `You are an expert radiologist assistant. Your task is to extract information from the provided radiology transcript and fill out the provided report template.
IMPORTANT INSTRUCTIONS:
1. The transcript comes from an automatic speech recognition (ASR) system and MAY CONTAIN ERRORS.
2. You must use your medical knowledge to INFER and CORRECT these errors.
3. Maintain the professional medical tone of the report.
4. Output ONLY the filled report content.`;

            const reportPrompt = `TEMPLATE:\n${geminiState.templateContent}\n\nTRANSCRIPT:\n${transcript}\n\nFILLED REPORT:`;

            const reportPayload = {
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: reportPrompt }]
                }]
            };

            const reportUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${geminiState.model}:generateContent?key=${geminiState.apiKey}`;
            const reportResponse = await fetch(reportUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });

            if (!reportResponse.ok) {
                const err = await reportResponse.json();
                throw new Error(err.error?.message || reportResponse.statusText);
            }

            const reportData = await reportResponse.json();
            const resultText = reportData.candidates?.[0]?.content?.parts?.[0]?.text || "No output.";

            // Display report
            if (ui.results.report) ui.results.report.textContent = resultText;

            // 4. Compare (Side-by-Side like app.js)
            updateStatus('Karşılaştırma yapılıyor...');
            if (typeof diff_match_patch !== 'undefined' && geminiState.truthContent) {
                const dmp = new diff_match_patch();
                const diffs = dmp.diff_main(geminiState.truthContent, resultText);
                dmp.diff_cleanupSemantic(diffs);

                // Generate side-by-side comparison HTML (matching app.js)
                const html = generateSideBySideDiff(diffs);
                if (ui.results.comparison) ui.results.comparison.innerHTML = html;
            }

        } catch (e) {
            console.error(e);
            alert("Gemini Error: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    function updateStatus(msg) {
        if (ui.actions.runBtn) {
            const btnText = ui.actions.runBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = msg;
            } else {
                ui.actions.runBtn.textContent = msg;
            }
        }
    }

    function setLoading(isLoading) {
        if (ui.actions.runBtn) {
            ui.actions.runBtn.disabled = isLoading;
            ui.actions.runBtn.textContent = isLoading ? "İşleniyor..." : "Simülasyonu Başlat (Gemini)";
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
        });
    }

    function generateSideBySideDiff(diffs) {
        let truthHTML = '';
        let generatedHTML = '';

        diffs.forEach(part => {
            const type = part[0];
            const text = part[1];
            const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            if (type === 0) { // Equal (Exists in both)
                truthHTML += `<span class="diff-text-equal" title="Eşleşiyor">${esc}</span>`;
                generatedHTML += `<span class="diff-text-equal" title="Eşleşiyor">${esc}</span>`;
            } else if (type === 1) { // Insert (Exists ONLY in Generated)
                generatedHTML += `<span class="diff-text-added" title="AI tarafından eklendi (Fazla)">${esc}</span>`;
            } else if (type === -1) { // Delete (Exists ONLY in Truth)
                truthHTML += `<span class="diff-text-missing" title="AI tarafından atlandı (Eksik)">${esc}</span>`;
            }
        });

        return `
            <div class="comparison-box">
                <div class="box-header">Gerçek Rapor (Referans)</div>
                <div class="box-content">${truthHTML}</div>
            </div>
            <div class="comparison-box">
                <div class="box-header">Gemini Raporu (Analiz)</div>
                <div class="box-content">${generatedHTML}</div>
            </div>
        `;
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGemini);
    } else {
        initGemini();
    }

})();
