// =================================================================
// 1. KONFIGURACE A KONSTANTY
// =================================================================

const CONFIG = {
    // Model, který používáme (tvůj požadovaný 2.5)
    MODEL_NAME: 'gemini-2.5-flash',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/'
};

// Inicializace Markdown parseru (pokud je knihovna načtena)
const md = window.markdownit ? window.markdownit() : null;


// =================================================================
// 2. SPRÁVCE API KLÍČE (Key Manager)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    initApiKeyLogic();
});

function initApiKeyLogic() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return; // Jsme na podstránce, kde input není

    // 1. Načíst uložený klíč
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        apiKeyInput.style.borderColor = "rgba(0, 255, 136, 0.5)";
    }

    // 2. Ukládat při psaní
    apiKeyInput.addEventListener('input', (e) => {
        const key = e.target.value.trim();
        localStorage.setItem('GEMINI_API_KEY', key);
        apiKeyInput.classList.remove('key-saved');
        apiKeyInput.style.borderColor = "";
    });

    // 3. Efekt při Enteru
    apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const key = apiKeyInput.value.trim();
            localStorage.setItem('GEMINI_API_KEY', key);

            if (key.length > 10) {
                apiKeyInput.classList.add('key-saved');
                const originalVal = apiKeyInput.value;
                apiKeyInput.value = "✅ KLÍČ ULOŽEN!";
                apiKeyInput.type = "text";

                setTimeout(() => {
                    apiKeyInput.value = originalVal;
                    apiKeyInput.type = "password";
                    apiKeyInput.classList.remove('key-saved');
                    apiKeyInput.style.borderColor = "rgba(0, 255, 136, 0.5)";
                    apiKeyInput.blur();
                }, 1500);
            } else {
                alert("⚠️ Klíč vypadá moc krátký. Zkontroluj ho.");
            }
        }
    });
}

function getApiKey() {
    // Zkusíme input (pokud jsme na menu)
    const inputElement = document.getElementById('apiKey');
    if (inputElement && inputElement.value.trim() !== "") {
        return inputElement.value.trim();
    }
    // Jinak bereme z paměti
    return localStorage.getItem('GEMINI_API_KEY');
}


// =================================================================
// 3. HLAVNÍ ŘÍDÍCÍ FUNKCE (Controller)
// =================================================================

async function runGemini(mode) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("⚠️ Chybí API Key! Jdi na hlavní Menu a vlož ho.");
        return;
    }

    // Zde rozhodneme, kterou specializovanou funkci spustit
    switch (mode) {
        case 'generation':
            await handleGeneratorMode(apiKey);
            break;
        case 'styling':
            await handleHumanizerMode(apiKey);
            break;
        case 'vision':
            await handleVisionMode(apiKey);
            break;
        case 'explainer':
            await handleExplainerMode(apiKey);
            break;
        case 'math':
            await handleMathMode(apiKey);
            break;
        case 'arduino':
            await handleArduinoMode(apiKey);
            break;
        case 'lab':
            await handleLabMode(apiKey);
            break;
        default:
            console.error("Neznámý mód: " + mode);
    }
}


// =================================================================
// 4. SPECIFICKÉ FUNKCE PRO KAŽDOU STRÁNKU
// =================================================================

/* --- GENERÁTOR KÓDU --- */
async function handleGeneratorMode(apiKey) {
    const promptInput = document.getElementById('gen-prompt');
    const languageSelect = document.getElementById('gen-language');
    const btn = document.getElementById('btn-gen-action');
    const resultEl = document.getElementById('gen-result');

    if (!promptInput || !btn) return;
    if (!promptInput.value.trim()) { alert("Napiš zadání."); return; }

    const lang = languageSelect.options[languageSelect.selectedIndex].text;
    const systemPrompt = `Jsi Senior Software Engineer. Naprogramuj kód v jazyce: ${lang}. ZADÁNÍ: ${promptInput.value}. Vrať POUZE samotný blok kódu.`;

    await processSimpleRequest(apiKey, systemPrompt, [{ text: promptInput.value }], btn, resultEl);
}

/* --- HUMANIZER --- */
async function handleHumanizerMode(apiKey) {
    const codeInput = document.getElementById('style-input-code');
    const customInput = document.getElementById('style-input-custom');
    const styleSelect = document.getElementById('style-preset');
    const btn = document.getElementById('btn-style-action');
    const resultEl = document.getElementById('style-result');

    if (!codeInput || !btn) return;
    if (!codeInput.value.trim()) { alert("Vlož kód."); return; }

    const style = styleSelect.value;
    const customInstr = customInput && customInput.value.trim() ? `DODATEČNÉ INSTRUKCE: ${customInput.value.trim()}` : "";
    const systemPrompt = `Jsi expert na Refactoring. CÍL: Přepiš kód do stylu ${style}. ${customInstr} Vrať POUZE upravený kód.`;

    await processSimpleRequest(apiKey, systemPrompt, [{ text: codeInput.value }], btn, resultEl);
}

/* --- VISION CODER --- */
async function handleVisionMode(apiKey) {
    const imageInput = document.getElementById('imageInput');
    const btn = document.getElementById('btn-vision-action');
    const resultEl = document.getElementById('vision-result');

    if (!imageInput || !btn) return;
    if (imageInput.files.length === 0) { alert("Nahraj obrázek!"); return; }

    // Převod obrázku
    const imageData = await fileToGenerativePart(imageInput.files[0]);
    const systemPrompt = `Jsi Frontend Developer. Podívej se na obrázek a napiš HTML/Tailwind CSS kód, který ho replikuje. Vrať POUZE kód.`;

    await processSimpleRequest(apiKey, systemPrompt, [imageData], btn, resultEl);
}

/* --- CODE EXPLAINER --- */
async function handleExplainerMode(apiKey) {
    const input = document.getElementById('explainer-input');
    const btn = document.getElementById('btn-explainer-action');
    const resultDiv = document.getElementById('explainer-result');

    if (!input || !btn) return;

    const systemPrompt = `Jsi učitel programování. Vysvětli tento kód studentovi. Použij Markdown.`;

    // Použijeme funkci pro Markdown výstup
    await processMarkdownRequest(apiKey, systemPrompt, [{ text: input.value }], btn, resultDiv);
}

/* --- LAB (Chemie/Elektro) --- */
async function handleLabMode(apiKey) {
    const input = document.getElementById('lab-prompt');
    const mode = document.getElementById('lab-mode').value;
    const btn = document.getElementById('btn-lab-action');
    const resultDiv = document.getElementById('lab-result');

    if (!input || !btn) return;
    if (!input.value.trim()) { alert("Zadej problém."); return; }

    const role = mode === 'chem' ? "Chemik" : "Elektrotechnik";
    const systemPrompt = `Jsi ${role}. Vyřeš zadaný problém, vysvětli postup a použij Markdown.`;

    await processMarkdownRequest(apiKey, systemPrompt, [{ text: input.value }], btn, resultDiv);
}

/* --- MATIKA (Split mód) --- */
async function handleMathMode(apiKey) {
    const prompt = document.getElementById('math-prompt');
    const imgInput = document.getElementById('mathImageInput');
    const btn = document.getElementById('btn-math-action');
    const textDiv = document.getElementById('math-text-result');
    const codeEl = document.getElementById('math-code-result');

    if (!btn) return;

    let userParts = [];
    if (prompt && prompt.value.trim()) userParts.push({ text: prompt.value });
    if (imgInput && imgInput.files.length > 0) userParts.push(await fileToGenerativePart(imgInput.files[0]));

    if (userParts.length === 0) { alert("Zadej text nebo fotku."); return; }

    const separator = "---PYTHON_CODE_BLOCK---";
    const systemPrompt = `Jsi matematik a expert na Python. 1. Vypočítej příklad a vysvětli postup (Markdown). 2. Napiš oddělovač "${separator}". 3. Napiš Python kód (Matplotlib) pro graf.`;

    // Unikátní zpracování pro Math
    await processSplitRequest(apiKey, systemPrompt, userParts, btn, separator, textDiv, codeEl, 'python');
}

/* --- ARDUINO (Split mód) --- */
async function handleArduinoMode(apiKey) {
    const prompt = document.getElementById('arduino-prompt');
    const btn = document.getElementById('btn-arduino-action');
    const wiringDiv = document.getElementById('arduino-wiring');
    const codeEl = document.getElementById('arduino-code');

    if (!prompt || !btn) return;
    if (!prompt.value.trim()) { alert("Popiš projekt."); return; }

    const separator = "---ARDUINO_CODE_BLOCK---";
    const systemPrompt = `Jsi expert na Arduino. 1. Napiš seznam součástek a zapojení (Markdown). 2. Napiš oddělovač "${separator}". 3. Napiš C++ kód pro Arduino.`;

    await processSplitRequest(apiKey, systemPrompt, [{ text: prompt.value }], btn, separator, wiringDiv, codeEl, 'cpp');
}


// =================================================================
// 5. JÁDRO KOMUNIKACE (Helpery pro volání API)
// =================================================================

/**
 * Odešle požadavek na Gemini API a vrátí textovou odpověď.
 */
async function sendToGemini(apiKey, systemPrompt, userParts) {
    const url = `${CONFIG.apiBaseUrl}${CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;

    // Sestavení zprávy
    const contents = [{
        role: "user",
        parts: [{ text: systemPrompt }, ...userParts]
    }];

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return data.candidates[0].content.parts[0].text;
}

/**
 * Zpracuje jednoduchý požadavek (vstup -> kód).
 * Používá se pro: Generator, Humanizer, Vision.
 */
async function processSimpleRequest(apiKey, sysPrompt, userParts, btn, resultEl) {
    setLoadingState(btn, resultEl, true);
    try {
        let rawText = await sendToGemini(apiKey, sysPrompt, userParts);

        // Vyčištění markdown bloků
        rawText = rawText.replace(/^```[a-z]*\n/i, '').replace(/```$/, '');

        resultEl.textContent = rawText;
        resultEl.removeAttribute('data-highlighted');
        hljs.highlightElement(resultEl);
    } catch (err) {
        handleError(err);
    } finally {
        setLoadingState(btn, resultEl, false);
    }
}

/**
 * Zpracuje požadavek, kde je výstupem Markdown text.
 * Používá se pro: Explainer, Lab.
 */
async function processMarkdownRequest(apiKey, sysPrompt, userParts, btn, resultDiv) {
    setLoadingState(btn, resultDiv, true);
    try {
        const rawText = await sendToGemini(apiKey, sysPrompt, userParts);
        resultDiv.innerHTML = md ? md.render(rawText) : rawText;
    } catch (err) {
        handleError(err);
    } finally {
        setLoadingState(btn, resultDiv, false);
    }
}

/**
 * Zpracuje "Split" požadavek (Text + Kód).
 * Používá se pro: Math, Arduino.
 */
async function processSplitRequest(apiKey, sysPrompt, userParts, btn, separator, textDiv, codeEl, codeLang) {
    // Nastavíme loading pro oba výstupy
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "⏳ Pracuji...";
    textDiv.style.opacity = "0.5";
    // Najdeme rodiče kódu (pre) pro opacity efekt
    const codeContainer = codeEl.parentElement.parentElement;
    codeContainer.style.opacity = "0.5";

    try {
        const rawText = await sendToGemini(apiKey, sysPrompt, userParts);
        const parts = rawText.split(separator);

        // 1. Část: Text (Markdown)
        const textPart = parts[0] ? parts[0].trim() : "Textová část chybí.";
        textDiv.innerHTML = md ? md.render(textPart) : textPart;

        // 2. Část: Kód
        let codePart = parts[1] ? parts[1].trim() : "// Kód chybí.";
        // Odstranění všech možných markdown hlaviček
        codePart = codePart.replace(/^```python\n/i, '')
            .replace(/^```cpp\n/i, '')
            .replace(/^```c\n/i, '')
            .replace(/```$/, '');

        codeEl.textContent = codePart;
        codeEl.className = `language-${codeLang} rounded-xl block h-full text-sm`; // Reset tříd
        codeEl.removeAttribute('data-highlighted');
        hljs.highlightElement(codeEl);

    } catch (err) {
        handleError(err);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
        textDiv.style.opacity = "1";
        codeContainer.style.opacity = "1";
    }
}


// =================================================================
// 6. POMOCNÉ FUNKCE (Utils)
// =================================================================

function setLoadingState(btn, element, isLoading) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerText; // Uložíme text
        btn.innerText = "⏳ Generuji...";
        btn.disabled = true;
        if (element) element.style.opacity = "0.5";
    } else {
        btn.innerText = btn.dataset.originalText || "Akce";
        btn.disabled = false;
        if (element) element.style.opacity = "1";
    }
}

function handleError(error) {
    console.error(error);
    alert("Chyba API:\n" + error.message);
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => alert("✅ Zkopírováno!"));
}

function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({ inlineData: { data: base64Data, mimeType: file.type } });
        };
        reader.readAsDataURL(file);
    });
}