const { jsPDF } = window.jspdf;

// --- State Management ---
let slides = [
    { id: Date.now(), content: `<div style="text-align:center; padding:50px;">
    <h1>หน้าแรก (Slide 1)</h1>
    <p>เขียน HTML ได้ที่ฝั่งซ้าย</p>
    <div style="color: blue;">รองรับ CSS Inline หรือ Style Tag</div>
</div>` }
];
let activeSlideIndex = 0;

// Elements
const slideListEl = document.getElementById('slide-list');
const htmlEditor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const currentTitleEl = document.getElementById('current-slide-title');

// --- Functions ---

function init() {
    renderSlideList();
    loadSlide(0);
}

function renderSlideList() {
    slideListEl.innerHTML = '';
    slides.forEach((slide, index) => {
        const li = document.createElement('li');
        li.textContent = `Slide ${index + 1}`;
        li.className = index === activeSlideIndex ? 'active' : '';
        li.onclick = () => loadSlide(index);
        slideListEl.appendChild(li);
    });
}

function loadSlide(index) {
    // Save current content before switching
    slides[activeSlideIndex].content = htmlEditor.value;
    
    activeSlideIndex = index;
    htmlEditor.value = slides[index].content;
    currentTitleEl.textContent = `Slide ${index + 1}`;
    
    renderSlideList();
    updatePreview();
}

function updatePreview() {
    const content = htmlEditor.value;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    
    // Inject LaTeX support (MathJax) into iframe
    const mathJaxScript = `
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    `;

    iframeDoc.open();
    iframeDoc.write(content + mathJaxScript);
    iframeDoc.close();
}

// Add Slide
document.getElementById('add-slide-btn').onclick = () => {
    slides.push({ id: Date.now(), content: '<h1>New Slide</h1>' });
    loadSlide(slides.length - 1);
};

// Sync Editor with Preview
htmlEditor.oninput = () => {
    slides[activeSlideIndex].content = htmlEditor.value;
    updatePreview();
};

// Toggle View for Mobile
document.getElementById('toggle-view').onclick = () => {
    const editor = document.querySelector('.editor-section');
    const preview = document.querySelector('.preview-section');
    editor.classList.toggle('hide');
    preview.classList.toggle('hide');
};

// --- Export PDF Logic ---
async function exportPDF() {
    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pdfContainer = document.getElementById('pdf-render-container');
    const btn = document.getElementById('export-pdf-btn');
    
    btn.textContent = "Processing...";
    btn.disabled = true;

    for (let i = 0; i < slides.length; i++) {
        // 1. Create a temporary div for rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '842pt'; // A4 Landscape width
        tempDiv.style.height = '595pt'; // A4 Landscape height
        tempDiv.style.background = 'white';
        tempDiv.innerHTML = slides[i].content;
        pdfContainer.appendChild(tempDiv);

        // 2. Capture with html2canvas
        const canvas = await html2canvas(tempDiv, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        // 3. Add to PDF
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 842, 595);

        // 4. Clean up
        pdfContainer.removeChild(tempDiv);
    }

    pdf.save('my-slides.pdf');
    btn.textContent = "Export All PDF";
    btn.disabled = false;
}

document.getElementById('export-pdf-btn').onclick = exportPDF;

// Run
init();
