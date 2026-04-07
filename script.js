/**
 * Ultimate Slide Engine Logic
 * Optimized for Desktop, iPad, and Mobile
 */

let slides = [{ id: Date.now(), content: `` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

// --- Core Function: Update Live Preview ---
function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    activeSlide.content = editor.value;

    const fullDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=1280">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 1280px; height: 720px; font-family: sans-serif; }
                </style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    // Debounce scaling slightly to ensure iframe is ready
    requestAnimationFrame(fitSlide);
}

// --- Core Function: Smart Responsive Scaling ---
function fitSlide() {
    if (!previewPane || !wrapper) return;

    const padding = window.innerWidth < 768 ? 20 : 60;
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    // Base Resolution: 1280x720 (16:9)
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    const finalScale = scale > 1 ? 1 : scale;
    
    wrapper.style.transform = `scale(${finalScale})`;
}

// --- UI: Tabs Management ---
function renderTabs() {
    tabsContainer.innerHTML = '';
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        tab.innerText = `Slide ${i + 1}`;
        tab.onclick = () => {
            activeSlideId = s.id;
            editor.value = s.content;
            renderTabs();
            updatePreview();
        };
        tabsContainer.appendChild(tab);
    });
}

// --- Actions ---
document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = ``;
    renderTabs();
    updatePreview();
};

document.getElementById('btn-toggle-view').onclick = () => {
    const workspace = document.getElementById('workspace');
    workspace.classList.toggle('view-preview');
    workspace.classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
};

window.addEventListener('resize', fitSlide);
editor.addEventListener('input', () => {
    // ใช้ requestIdleCallback หรือ setTimeout เพื่อลดภาระเครื่อง
    updatePreview();
});

// --- PDF Export (Optimized) ---
document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    try {
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            exportFrame.srcdoc = `
                <html>
                    <head>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>body { margin:0; padding:0; width:1280px; height:720px; overflow:hidden; }</style>
                    </head>
                    <body>${slide.content}</body>
                </html>
            `;
            
            await new Promise(r => setTimeout(r, 1200)); // ให้เวลา Tailwind render

            const canvas = await html2canvas(exportFrame.contentDocument.body, {
                width: 1280, height: 720, scale: 1.5, // เพิ่มคุณภาพภาพใน PDF
                useCORS: true,
                logging: false
            });
            
            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1280, 720);
        }
        pdf.save(`presentation_${Date.now()}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Export failed. Check console.");
    } finally {
        overlay.classList.add('hidden');
    }
};

// --- Initialization ---
function init() {
    editor.value = slides[0].content;
    // เริ่มต้นที่หน้า Editor สำหรับ Mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('workspace').classList.add('view-editor');
    }
    renderTabs();
    updatePreview();
}

init();
