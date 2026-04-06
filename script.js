// --- 1. State Management ---
let slides = [
    {
        id: Date.now(),
        content: `<style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
    h1 { font-size: 3rem; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
</style>
<h1>สไลด์หน้าแรก 🚀</h1>
<p>แก้ไขโค้ด HTML/CSS ด้านซ้ายได้เลย!</p>`
    }
];

let activeSlideId = slides[0].id;
let isMobileEditorView = true;

// --- 2. DOM Elements ---
const tabsContainer = document.getElementById('tabs-container');
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const workspace = document.getElementById('workspace');

// Buttons
const btnAddSlide = document.getElementById('btn-add-slide');
const btnExportPdf = document.getElementById('btn-export-pdf');
const btnToggleView = document.getElementById('btn-toggle-view');

// --- 3. Core Functions ---

function renderTabs() {
    tabsContainer.innerHTML = '';
    slides.forEach((slide, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${slide.id === activeSlideId ? 'active' : ''}`;
        
        const title = document.createElement('span');
        title.innerText = `Slide ${index + 1}`;
        title.onclick = () => switchSlide(slide.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.className = 'tab-delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteSlide(slide.id);
        };

        tab.appendChild(title);
        if (slides.length > 1) tab.appendChild(deleteBtn);
        
        tabsContainer.appendChild(tab);
    });
}

function switchSlide(id) {
    activeSlideId = id;
    const activeSlide = slides.find(s => s.id === id);
    editor.value = activeSlide.content;
    updatePreview();
    renderTabs();
}

function addSlide() {
    const newSlide = {
        id: Date.now(),
        content: `<style>
    body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff; }
</style>
<h1>สไลด์ใหม่</h1>`
    };
    slides.push(newSlide);
    switchSlide(newSlide.id);
}

function deleteSlide(id) {
    if (slides.length === 1) return;
    slides = slides.filter(s => s.id !== id);
    if (activeSlideId === id) {
        switchSlide(slides[slides.length - 1].id);
    } else {
        renderTabs();
    }
}

function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    // อัปเดต State จาก Editor
    activeSlide.content = editor.value;
    // Inject ลง iframe
    previewFrame.srcdoc = activeSlide.content;
}

// --- 4. Event Listeners ---

editor.addEventListener('input', updatePreview);
btnAddSlide.addEventListener('click', addSlide);

// Mobile Toggle View
btnToggleView.addEventListener('click', () => {
    isMobileEditorView = !isMobileEditorView;
    if (isMobileEditorView) {
        workspace.classList.add('view-editor');
        workspace.classList.remove('view-preview');
    } else {
        workspace.classList.add('view-preview');
        workspace.classList.remove('view-editor');
    }
});

// กำหนด View เริ่มต้นสำหรับ Mobile
workspace.classList.add('view-editor');

// --- 5. PDF Export Logic ---

btnExportPdf.addEventListener('click', async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');

    try {
        const { jsPDF } = window.jspdf;
        // ตั้งค่า PDF เป็นแนวนอน (Landscape), ขนาด 1280x720 (16:9 ratio)
        const pdf = new jsPDF('landscape', 'px', [1280, 720]);
        const exportFrame = document.getElementById('export-frame');

        for (let i = 0; i < slides.length; i++) {
            // โหลดโค้ดลง iframe ที่ซ่อนอยู่
            exportFrame.srcdoc = slides[i].content;
            
            // รอให้ iframe render (ให้เวลา Scripts/CSS/Fonts โหลดทำงาน)
            await new Promise(resolve => {
                exportFrame.onload = () => setTimeout(resolve, 500); // ดีเลย์เพิ่มเผื่อ CDN (เช่น LaTeX/MathJax)
            });

            // จับภาพด้วย html2canvas ดึงจาก Body ของ iframe โดยตรง
            const canvas = await html2canvas(exportFrame.contentDocument.body, {
                width: 1280,
                height: 720,
                windowWidth: 1280,
                windowHeight: 720,
                scale: 1, // ปรับ scale เป็น 2 ถ้าต้องการความคมชัดระดับ Retina
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }

        pdf.save('HTML-Slides.pdf');
    } catch (error) {
        console.error("Export Error:", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    } finally {
        overlay.classList.add('hidden');
    }
});

// --- 6. Init ---
switchSlide(slides[0].id);
