/**
 * main.js - Application Logic
 */

// State
const state = {
    provider: 'openai', // 'openai' | 'google'
    transcriptionModel: 'whisper-1', // Default
    audioFile: null,
    templateFile: null,     // Legacy (if we keep upload)
    templateContent: null,  // New: content directly from selection
    truthFile: null,
    apiKey: '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', // OpenAI Key
    transcript: '',
    generatedReport: '',
    truthReport: ''
};

// DOM Elements Container
let elements = {};

const TRANSCRIPTION_MODELS = {
    openai: [
        { value: 'whisper-1', label: 'Whisper-1 (Standard)' },
        { value: 'gpt-4o-audio-preview', label: 'GPT-4o Audio' },
        { value: 'gpt-4o-mini-audio-preview', label: 'GPT-4o Mini Audio' },
        { value: 'gpt-4o-audio-preview-diarize', label: 'GPT-4o Audio (Diarize)' }
    ]
};

// ... inside init ...

// --- Gemini API Calls ---
// --- Gemini API Calls Removed ---


// --- Initialization ---
function init() {
    console.log("Initializing App...");

    // Populate elements
    elements = {
        dropZones: {
            audio: document.getElementById('drop-zone-audio'),
            template: document.getElementById('selection-zone-template'),
            truth: document.getElementById('drop-zone-truth')
        },
        inputs: {
            audio: document.getElementById('input-audio'),
            template: document.getElementById('input-template'),
            truth: document.getElementById('input-truth'),
            apiKey: document.getElementById('api-key-input')
        },
        selects: {
            template: document.getElementById('select-template'),
            provider: document.getElementById('select-provider'),
            model: document.getElementById('select-model')
        },
        infos: {
            audio: document.getElementById('file-info-audio'),
            template: document.getElementById('file-info-template'),
            truth: document.getElementById('file-info-truth')
        },
        btnSimulate: document.getElementById('btn-simulate'),
        resultsSection: document.getElementById('results-section'),
        outputs: {
            transcript: document.getElementById('output-transcript'),
            generated: document.getElementById('output-generated'),
            comparison: document.getElementById('output-comparison')
        },
        badges: {
            transcript: document.querySelector('#results-section .result-card:nth-child(1) .badge'),
            generated: document.querySelector('#results-section .result-card:nth-child(2) .badge')
        }
    };

    setupDragAndDrop();
    setupFileInputs();
    setupTemplateSelection();

    // Load persisted settings before setting up UI
    loadSettings();

    setupProviderSelection();
    setupSimulation();
    setupTabs();
}

function setupFileInputs() {
    // Audio Input
    if (elements.inputs.audio) {
        elements.inputs.audio.addEventListener('change', (e) => {
            handleFiles(e.target.files, 'audio');
        });
    }

    // Template Input (Legacy/Fallback)
    if (elements.inputs.template) {
        elements.inputs.template.addEventListener('change', (e) => {
            handleFiles(e.target.files, 'template');
        });
    }

    // Truth Input
    if (elements.inputs.truth) {
        elements.inputs.truth.addEventListener('change', (e) => {
            handleFiles(e.target.files, 'truth');
        });
    }
}

// --- Persistence ---
function loadSettings() {
    const savedProvider = localStorage.getItem('radyo_provider');
    if (savedProvider) state.provider = savedProvider;

    const savedModel = localStorage.getItem('radyo_model');
    if (savedModel) state.transcriptionModel = savedModel;

    const savedApiKey = localStorage.getItem('radyo_openai_key');
    if (savedApiKey) state.apiKey = savedApiKey;

    if (savedApiKey) state.apiKey = savedApiKey;
}

function saveSetting(key, value) {
    localStorage.setItem(key, value);
}

// --- Provider Selection ---
function setupProviderSelection() {
    if (!elements.selects.provider || !elements.selects.model) return;

    // Set initial values from state (loaded from storage)
    if (state.provider) elements.selects.provider.value = state.provider;

    function populateModels(provider) {
        elements.selects.model.innerHTML = '';
        const models = TRANSCRIPTION_MODELS[provider] || [];
        models.forEach(m => {
            const option = document.createElement('option');
            option.value = m.value;
            option.textContent = m.label;
            elements.selects.model.appendChild(option);
        });

        // Restore selected model if valid for this provider, else default
        const validValues = models.map(m => m.value);
        if (state.transcriptionModel && validValues.includes(state.transcriptionModel)) {
            elements.selects.model.value = state.transcriptionModel;
        } else {
            state.transcriptionModel = models[0]?.value;
        }
    }

    elements.selects.provider.addEventListener('change', (e) => {
        state.provider = e.target.value;
        saveSetting('radyo_provider', state.provider);
        populateModels(state.provider);
        updateProviderUI();
    });

    elements.selects.model.addEventListener('change', (e) => {
        state.transcriptionModel = e.target.value;
        saveSetting('radyo_model', state.transcriptionModel);
    });

    // Initial State
    populateModels(state.provider);
    updateProviderUI();
}

function updateProviderUI() {
    // Only OpenAI supported
    if (elements.inputs.apiKey) {
        elements.inputs.apiKey.classList.remove('hidden');
    }
}

// --- Template Selection ---
function setupTemplateSelection() {
    if (!elements.selects.template || typeof REPORT_TEMPLATES === 'undefined') return;

    const select = elements.selects.template;

    // Populate
    Object.keys(REPORT_TEMPLATES).forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;

        const templates = REPORT_TEMPLATES[category];
        Object.keys(templates).forEach(name => {
            const option = document.createElement('option');
            option.value = category + "::" + name; // Unique key
            option.textContent = name;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });

    // Listen for change
    select.addEventListener('change', (e) => {
        const value = e.target.value;
        if (!value) {
            state.templateContent = null;
            elements.dropZones.template.classList.remove('has-file');
            elements.infos.template.textContent = '';
        } else {
            const [cat, name] = value.split("::");
            state.templateContent = REPORT_TEMPLATES[cat][name];

            // UI Feedback
            elements.dropZones.template.classList.add('has-file');
            elements.infos.template.textContent = `Seçildi: ${name}`;
        }
        checkReadyToRun();
    });
}

// --- File Handling ---
function setupDragAndDrop() {
    Object.keys(elements.dropZones).forEach(key => {
        const zone = elements.dropZones[key];
        if (!zone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.add('drag-over'), false);
        });

        // Remove highlight
        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.remove('drag-over'), false);
        });

        // Handle Drop (Only for Audio and Truth now, Template is select)
        if (key !== 'template') {
            zone.addEventListener('drop', (e) => handleDrop(e, key), false);

            // Click to upload
            zone.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                    elements.inputs[key].click();
                }
            });
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e, type) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files, type);
}

// --- Tabs System ---
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            contents.forEach(c => c.classList.add('hidden'));

            // Add active
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
            }
        });
    });
}


function handleFiles(files, type) {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate type
    if (type === 'audio') {
        const validExtensions = ['.mp3', '.wav', '.webm', '.m4a', '.mpga', '.mpeg'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        const isAudioType = file.type.startsWith('audio/') || file.type.startsWith('video/webm');
        const hasValidExt = validExtensions.includes(ext);

        if (!isAudioType && !hasValidExt) {
            alert('Lütfen geçerli bir ses dosyası yükleyin (MP3, WAV, WEBM).');
            return;
        }
    }

    // Update State
    state[`${type}File`] = file;

    // UI Update
    if (elements.dropZones[type]) {
        elements.dropZones[type].classList.add('has-file');
        elements.infos[type].textContent = `Seçildi: ${file.name} (${formatSize(file.size)})`;
    }

    checkReadyToRun();
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkReadyToRun() {
    const isReady = state.audioFile && (state.templateContent || state.templateFile) && state.truthFile;
    if (elements.btnSimulate) elements.btnSimulate.disabled = !isReady;
}

// --- Simulation Logic ---
function setupSimulation() {
    if (!elements.btnSimulate) return;

    elements.btnSimulate.addEventListener('click', async () => {
        // Validation based on provider
        if (state.provider === 'openai' && !state.apiKey) {
            alert('Lütfen OpenAI API Anahtarınızı girin.');
            elements.inputs.apiKey.focus();
            return;
        }

        startLoading();

        try {
            // Update Badges based on selection
            if (elements.badges.transcript) elements.badges.transcript.textContent = state.transcriptionModel;
            if (elements.badges.generated) elements.badges.generated.textContent = 'GPT-4o';

            // 1. Read Text Files
            let templateText = state.templateContent;
            if (!templateText && state.templateFile) {
                templateText = await readFileAsText(state.templateFile);
            }

            const truthText = await readFileAsText(state.truthFile);
            state.truthReport = truthText;

            // 2. Transcribe Audio
            updateStatus(`Ses metne dönüştürülüyor (${state.transcriptionModel})...`);
            let transcript;

            if (state.transcriptionModel === 'whisper-1') {
                transcript = await transcribeWithWhisper(state.audioFile);
            } else {
                // All GPT-4o variants
                transcript = await transcribeWithGPT4oAudio(state.audioFile, state.transcriptionModel);
            }

            state.transcript = transcript;
            elements.outputs.transcript.innerText = transcript;

            // 3. Generate Report
            updateStatus('Rapor oluşturuluyor...');
            let generated;
            generated = await mockOrRealGenerate(transcript, templateText);

            state.generatedReport = generated;
            elements.outputs.generated.innerText = generated;

            // 4. Compare
            updateStatus('Karşılaştırma yapılıyor...');
            const comparisonHTML = compareTexts(truthText, generated);
            elements.outputs.comparison.innerHTML = comparisonHTML;

            // Show results
            elements.resultsSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert('Hata oluştu: ' + error.message);
        } finally {
            stopLoading();
        }
    });
}

function startLoading() {
    elements.btnSimulate.disabled = true;
    elements.btnSimulate.querySelector('.btn-text').textContent = 'İşleniyor...';
    elements.btnSimulate.querySelector('.btn-loader').classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
}

function stopLoading() {
    elements.btnSimulate.disabled = false;
    elements.btnSimulate.querySelector('.btn-text').textContent = 'Simülasyonu Başlat';
    elements.btnSimulate.querySelector('.btn-loader').classList.add('hidden');
}

function updateStatus(msg) {
    elements.btnSimulate.querySelector('.btn-text').textContent = msg;
}

// --- Utilities ---
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove "data:audio/xyz;base64," prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}

// --- OpenAI API Calls ---

// 1. Whisper-1 Call
async function transcribeWithWhisper(audioFile) {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('prompt', 'Radyoloji raporu, BT, MR, tomografi, lezyon, parankim, kontrast, efüzyon, milimetrik, nodül, fraktür, vertebra, disk, herniasyon, sekans, aksiyel, sagital, koronal, perfüzyon, Pnömotoraks, Kardiyotorasik. ' + (state.transcriptionModel.includes('diarize') ? 'Speaker identification, Speaker A, Speaker B.' : ''));

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Whisper API Hatası: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text;
}

// 2. GPT-4o Audio / Mini / Diarize Calls
async function transcribeWithGPT4oAudio(audioFile, modelSlug) {
    // Determine exact model name from slug
    // Allows "gpt-4o-transcribe" mapping to "gpt-4o-audio-preview"
    // "gpt-4o-mini-transcribe" mapping to "gpt-4o-mini-audio-preview" (if valid)
    let apiModel = 'gpt-4o-audio-preview';
    if (modelSlug.includes('mini')) {
        apiModel = 'gpt-4o-mini-audio-preview';
    }

    const base64Audio = await fileToBase64(audioFile);

    // Check format
    const ext = audioFile.name.split('.').pop().toLowerCase();
    const supportedFormats = ['wav', 'mp3'];

    let instructions = "Transcribe this medical audio strictly verbatim. Focus on accuracy for terms: perfüzyon, Pnömotoraks, Kardiyotorasik. Do not translate. Output only the transcription.";

    if (modelSlug.includes('diarize')) {
        instructions = "Transcribe the audio and identify speakers (e.g. Speaker 1, Speaker 2). Format as [Speaker]: [Text]. Medical context.";
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                modalities: ["text"],
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: instructions },
                            {
                                type: "input_audio",
                                input_audio: {
                                    data: base64Audio,
                                    format: supportedFormats.includes(ext) ? ext : 'wav'
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`${apiModel} Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (e) {
        console.warn(`${apiModel} failed, falling back to Whisper...`, e);
        // Fallback
        return transcribeWithWhisper(audioFile);
    }
}

async function mockOrRealGenerate(transcript, template) {
    const systemPrompt = `You are an expert radiologist assistant. Your task is to extract information from the provided radiology transcript and fill out the provided report template.

IMPORTANT INSTRUCTIONS:
1. The transcript comes from an automatic speech recognition (ASR) system and MAY CONTAIN ERRORS.
2. You must use your medical knowledge to INFER and CORRECT these errors.
3. Maintain the professional medical tone of the report.
4. Output ONLY the filled report content.`;

    const userPrompt = `TEMPLATE:\n${template}\n\nTRANSCRIPT:\n${transcript}\n\nFILLED REPORT:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2 // Lower temperature for more deterministic/focused output
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`GPT API Hatası: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- Google Models Removed ---


// ... inside init ...

// --- Gemini Robust Cascade Removed ---


// --- Comparison Logic (Diff-Match-Patch -> Side by Side) ---
function compareTexts(truth, generated) {
    if (typeof diff_match_patch === 'undefined') {
        return "Diff kütüphanesi yüklenemedi.";
    }
    const dmp = new diff_match_patch();

    // Compute diff
    const diffs = dmp.diff_main(truth, generated);
    dmp.diff_cleanupSemantic(diffs);

    let truthHTML = '';
    let generatedHTML = '';

    // diffs is array of [operation, text]
    // operation: 0 = equal, 1 = insert (in generated), -1 = delete (in truth)

    diffs.forEach(part => {
        const type = part[0];
        const text = part[1];

        // Escape HTML
        const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (type === 0) { // Equal (Exists in both)
            // Green in both
            truthHTML += `<span class="diff-text-equal" title="Eşleşiyor">${escapedText}</span>`;
            generatedHTML += `<span class="diff-text-equal" title="Eşleşiyor">${escapedText}</span>`;
        } else if (type === 1) { // Insert (Exists ONLY in Generated)
            // Blue in Generated (Added)
            generatedHTML += `<span class="diff-text-added" title="AI tarafından eklendi (Fazla)">${escapedText}</span>`;
            // Nothing in Truth
        } else if (type === -1) { // Delete (Exists ONLY in Truth)
            // Red in Truth (Missing)
            truthHTML += `<span class="diff-text-missing" title="AI tarafından atlandı (Eksik)">${escapedText}</span>`;
            // Nothing in Generated
        }
    });

    return `
        <div class="comparison-box">
            <div class="box-header">Gerçek Rapor (Referans)</div>
            <div class="box-content">${truthHTML}</div>
        </div>
        <div class="comparison-box">
            <div class="box-header">AI Raporu (Analiz)</div>
            <div class="box-content">${generatedHTML}</div>
        </div>
    `;
}

// Start
document.addEventListener('DOMContentLoaded', init);
