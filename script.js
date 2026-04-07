const { jsPDF } = window.jspdf;

// --- State ---
let slides = [
    { id: Date.now(), content: `<div style="text-align:center; padding: 50px;"><h1>หน้าแรก</h1><p>เขียน HTML ได้ที่นี่</p></div>` }
];
let activeIndex = 0;

// --- Selectors ---
const slideTabs = document.getElementById('slideTabs');
const htmlInput = document.getElementById('htmlInput');
const previewFrame = document.getElementById('previewFrame');
const addSlideBtn = document.getElementById('addSlideBtn');
const exportBtn = document.getElementById('exportBtn');
const toggleModeBtn = document.getElementById('toggleMode');

// --- Functions ---

function init() {
    renderTabs();
    loadActiveSlide();
}

function renderTabs() {
    slideTabs.innerHTML = '';
    slides.forEach((slide, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${index === activeIndex ? 'active' : ''}`;
        tab.innerText = index + 1;
        tab.onclick = () => switchSlide(index);
        slideTabs.appendChild(tab);
    });
}

function loadActiveSlide() {
    const slide = slides[activeIndex];
    htmlInput.value = slide.content;
    updatePreview(slide.content);
}

function updatePreview(content) {
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    // Inject CSS สำหรับจำลองหน้ากระดาษข้างใน iframe
    doc.write(`
        <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; word-wrap: break-word; }
            img { max-width: 100%; }
        </style>
        ${content}
    `);
    doc.close();
}

function switchSlide(index) {
    // Save current content first
    slides[activeIndex].content = htmlInput.value;
    activeIndex = index;
    renderTabs();
    loadActiveSlide();
}

function addNewSlide() {
    slides[activeIndex].content = htmlInput.value; // Save current
    const newSlide = { id: Date.now(), content: '<h1>หน้าใหม่</h1>' };
    slides.push(newSlide);
    activeIndex = slides.length - 1;
    renderTabs();
    loadActiveSlide();
}

async function exportToPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const loadingBtn = exportBtn;
    loadingBtn.innerText = "กำลังประมวลผล...";
    loadingBtn.disabled = true;

    // บันทึกหน้าปัจจุบันก่อน export
    slides[activeIndex].content = htmlInput.value;

    for (let i = 0; i < slides.length; i++) {
        // อัปเดต iframe เพื่อเตรียมถ่ายรูป
        updatePreview(slides[i].content);
        
        // รอการ Render แป๊บหนึ่ง
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(previewFrame.contentDocument.body, {
            scale: 2, // เพิ่มความชัด
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save('presentation.pdf');
    loadingBtn.innerText = "📄 Export PDF";
    loadingBtn.disabled = false;
    
    // กลับมาหน้าปัจจุบัน
    loadActiveSlide();
}

// --- Event Listeners ---

htmlInput.addEventListener('input', (e) => {
    updatePreview(e.target.value);
});

addSlideBtn.addEventListener('click', addNewSlide);

exportBtn.addEventListener('click', exportToPDF);

toggleModeBtn.addEventListener('click', () => {
    document.querySelector('.app-container').classList.toggle('preview-mode');
});

// Start the engine
init();
