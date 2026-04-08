/**
 * Ultimate Slide Engine v2 Logic
 */

let slides = [{
    id: Date.now(),
    content: `` // เริ่มแบบว่างๆ เปล่าๆ
}];

let activeSlideId = slides[0].id;

// Elements
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

// --- Core Function: Smart Preview with Auto-Scaling ---
function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    activeSlide.content = editor.value;

    const fullDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 1280px; height: 720px; }
                </style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    // Debounce scaling just a bit for stability
    requestAnimationFrame(fitSlide);
}

// 🏆 The Fix for Preview 🏆
function fitSlide() {
    if (!previewPane || !wrapper) return;

    // Get the actual available space in the pane
    const availableWidth = previewPane.clientWidth - 40; // 40px padding
    const availableHeight = previewPane.clientHeight - 40;
    
    // Base resolution is 1280x720 (16:9)
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    const finalScale = scale > 1 ? 1 : scale; // Don't upscale
    
    wrapper.style.transform = `scale(${finalScale})`;
}

// --- Tabs Management ---
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

// --- UI Listeners ---
document.getElementById('btn-add-slide').onclick = () => {
    slides.push({ id: Date.now(), content: `` });
    activeSlideId = slides[slides.length-1].id;
    editor.value = ``;
    renderTabs();
    updatePreview();
};

window.addEventListener('resize', fitSlide);
editor.oninput = updatePreview;

// --- 🏆 The Master Fix for Export 🏆 ---
// ใช้ window.print() และ Print CSS แทน html2canvas เพื่อความแม่นยำ 100%
document.getElementById('btn-export-pdf').onclick = () => {
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Export PDF</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    @page { size: 1280px 720px; margin: 0; }
                    body { margin: 0; }
                    .page-break { page-break-after: always; display: block; height: 0; overflow: hidden; }
                    .slide-page { width: 1280px; height: 720px; position: relative; overflow: hidden; -webkit-print-color-adjust: exact !important; }
                }
            </style>
        </head>
        <body>
    `;

    slides.forEach(slide => {
        htmlContent += `<div class="slide-page">${slide.content}</div>`;
        htmlContent += `<div class="page-break"></div>`;
    });

    htmlContent += `</body></html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // รอสักครู่ให้ Tailwind Render แล้วค่อยเรียก Print Dialog
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1500);
};

// --- Initialization ---
editor.value = slides[0].content;
renderTabs();
updatePreview();
