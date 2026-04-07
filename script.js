const { jsPDF } = window.jspdf;

// --- State Management ---
let slides = [
    { html: `<div style="padding: 40px; text-align: center; color: #0a192f;">
    <h1 style="font-size: 48px;">Slide 1</h1>
    <p style="font-size: 24px;">Core Principle HTML Engine</p>
    <div style="margin-top: 50px; color: green;">$$ E = mc^2 $$</div>
</div>` }
];
let currentSlideIndex = 0;

// Elements
const htmlEditor = document.getElementById('htmlEditor');
const previewFrame = document.getElementById('previewFrame');
const slideTabs = document.getElementById('slideTabs');
const addSlideBtn = document.getElementById('addSlideBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// --- Functions ---

function init() {
    renderTabs();
    loadSlide(0);
}

function renderTabs() {
    slideTabs.innerHTML = '';
    slides.forEach((_, index) => {
        const tab = document.createElement('div');
        tab.className = `slide-tab ${index === currentSlideIndex ? 'active' : ''}`;
        tab.innerText = `Slide ${index + 1}`;
        tab.onclick = () => loadSlide(index);
        slideTabs.appendChild(tab);
    });
}

function loadSlide(index) {
    currentSlideIndex = index;
    htmlEditor.value = slides[index].html;
    renderPreview();
    renderTabs();
}

function renderPreview() {
    const content = htmlEditor.value;
    slides[currentSlideIndex].html = content; // Update state
    
    // Inject content into Iframe
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    // เพิ่มสไตล์พื้นฐานให้สไลด์ และรองรับ LaTeX ผ่าน MathJax
    doc.write(`
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
            body { margin: 0; font-family: sans-serif; background: white; min-height: 100vh; }
        </style>
        ${content}
    `);
    doc.close();
}

// Event Listeners
htmlEditor.addEventListener('input', renderPreview);

addSlideBtn.addEventListener('click', () => {
    slides.push({ html: '<h1>New Slide</h1>' });
    loadSlide(slides.length - 1);
});

// --- PDF Export Logic ---
exportPdfBtn.addEventListener('click', async () => {
    exportPdfBtn.innerText = 'Generating...';
    exportPdfBtn.disabled = true;

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1024, 768]
    });

    const exportContainer = document.getElementById('exportContainer');

    for (let i = 0; i < slides.length; i++) {
        // 1. Create temporary element for rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '1024px';
        tempDiv.style.height = '768px';
        tempDiv.style.background = 'white';
        tempDiv.innerHTML = slides[i].html;
        exportContainer.appendChild(tempDiv);

        // 2. Capture with html2canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2, // Higher quality
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        
        // 3. Add to PDF
        if (i > 0) pdf.addPage([1024, 768], 'landscape');
        pdf.addImage(imgData, 'PNG', 0, 0, 1024, 768);

        // 4. Cleanup
        exportContainer.removeChild(tempDiv);
    }

    pdf.save('core-principle-slides.pdf');
    exportPdfBtn.innerText = 'Export PDF';
    exportPdfBtn.disabled = false;
});

// Mobile Toggle logic
document.getElementById('toggleMobile').addEventListener('click', () => {
    document.getElementById('editorSection').classList.toggle('hidden');
    document.getElementById('previewSection').classList.toggle('hidden');
});

init();
