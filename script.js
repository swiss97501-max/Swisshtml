// 1. THEME CONFIG
const themes = {
  dark: { "--bg": "#0f172a", "--text": "#e2e8f0", "--accent": "#38bdf8" },
  light: { "--bg": "#ffffff", "--text": "#111111", "--accent": "#2563eb" },
  neon: { "--bg": "#020617", "--text": "#22c55e", "--accent": "#facc15" }
};

let currentTheme = "dark";

// 2. STATE
let slides = [{ id: Date.now(), content: `` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');

// 3. THEME INJECTION LOGIC
function themeToCSS(themeName) {
    const theme = themes[themeName];
    let css = ":root {";
    for (let key in theme) { css += `${key}: ${theme[key]};`; }
    css += "}";
    return `<style>${css}</style>`;
}

function setTheme(name) {
    currentTheme = name;
    document.getElementById('theme-indicator').innerText = `CURRENT: ${name.toUpperCase()}`;
    updatePreview();
}

// 4. PREVIEW PIPELINE
function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    activeSlide.content = editor.value;

    const fullDoc = `
        <html>
            <head>
                <meta name="viewport" content="width=1280">
                <script src="https://cdn.tailwindcss.com"></script>
                ${themeToCSS(currentTheme)}
                <style>
                    body { 
                        margin: 0; padding: 0; 
                        background: var(--bg); color: var(--text); 
                        overflow: hidden; width: 1280px; height: 720px;
                        transition: background 0.3s, color 0.3s;
                    }
                </style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    setTimeout(fitSlide, 50);
}

// 5. AUTO SCALING (For iPad/Mobile)
function fitSlide() {
    const padding = 40;
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    wrapper.style.transform = `scale(${scale > 1 ? 1 : scale})`;
}

// 6. EXPORT PIPELINE
document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        exportFrame.srcdoc = `
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    ${themeToCSS(currentTheme)}
                    <style>
                        body { margin:0; padding:0; width:1280px; height:720px; background: var(--bg); color: var(--text); }
                    </style>
                </head>
                <body>
                    <div style="width:1280px; height:720px;">${slide.content}</div>
                </body>
            </html>
        `;
        
        await new Promise(r => setTimeout(r, 800)); // รอ Render

        const canvas = await html2canvas(exportFrame.contentDocument.body, {
            width: 1280, height: 720, scale: 1, useCORS: true
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }

    pdf.save(`presentation-${currentTheme}.pdf`);
    overlay.classList.add('hidden');
};

// 7. UI INTERACTION
function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        tab.innerText = `Slide ${i + 1}`;
        tab.onclick = () => { activeSlideId = s.id; editor.value = s.content; renderTabs(); updatePreview(); };
        container.appendChild(tab);
    });
}

document.getElementById('btn-add-slide').onclick = () => {
    slides.push({ id: Date.now(), content: `` });
    activeSlideId = slides[slides.length-1].id;
    editor.value = ``;
    renderTabs();
    updatePreview();
};

window.addEventListener('resize', fitSlide);
editor.oninput = updatePreview;
document.getElementById('btn-toggle-view').onclick = () => {
    document.getElementById('workspace').classList.toggle('view-preview');
    document.getElementById('workspace').classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
};

// INIT
setTheme('dark');
renderTabs();
