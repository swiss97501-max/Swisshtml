// --- 1. State Management ---
// เริ่มต้นด้วยสไลด์ว่าง 1 หน้า
let slides = [{
    id: Date.now(),
    content: `` 
}];

let activeSlideId = slides[0].id;

// --- 2. DOM Elements ---
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

// --- 3. Core Functions ---

/**
 * ฟังก์ชันสำหรับปรับขนาดสไลด์ (1280x720) ให้พอดีกับหน้าจอที่ดูอยู่
 * ใช้ CSS Transform Scale เพื่อไม่ให้สไลด์ตกขอบใน iPad/Mobile
 */
function fitSlide() {
    const padding = 40; // เว้นระยะขอบจอเล็กน้อย
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    // คำนวณอัตราส่วน (Base คือ 1280x720)
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    
    // ปรับ Scale (ไม่ให้เกิน 1 หรือ 100% ถ้าจอใหญ่กว่าสไลด์)
    const finalScale = scale > 1 ? 1 : scale;
    
    wrapper.style.transform = `scale(${finalScale})`;
}

/**
 * ฟังก์ชันอัปเดต Preview ใน iframe แบบ Real-time
 * มีการ Inject Tailwind CSS และการตั้งค่า Viewport พื้นฐาน
 */
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
                <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
                <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background-color: white; 
                        width: 1280px; 
                        height: 720px;
                    }
                </style>
            </head>
            <body>
                ${activeSlide.content}
            </body>
        </html>
    `;
    
    // ใช้ srcdoc เพื่อ render HTML จาก string โดยตรง
    previewFrame.srcdoc = fullDoc;
    
    // สั่งให้คำนวณการจัดวางใหม่หลังเนื้อหาเปลี่ยน
    setTimeout(fitSlide, 50);
}

/**
 * ฟังก์ชันจัดการ Tabs สไลด์ด้านบน
 */
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

// --- 4. Event Listeners ---

// พิมพ์โค้ดแล้ว Preview อัปเดตทันที
editor.addEventListener('input', updatePreview);

// เพิ่มสไลด์ใหม่ (หน้าว่าง)
document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

// สลับโหมด Editor / Preview บน Mobile/iPad
document.getElementById('btn-toggle-view').onclick = () => {
    const workspace = document.getElementById('workspace');
    workspace.classList.toggle('view-preview');
    workspace.classList.toggle('view-editor');
    // หลังจากสลับหน้าจอ ให้คำนวณ Scale ใหม่เพื่อให้สไลด์พอดีจอ
    setTimeout(fitSlide, 150);
};

// ปรับ Scale อัตโนมัติเมื่อมีการย่อ/ขยายหน้าต่าง Browser
window.addEventListener('resize', fitSlide);

// --- 5. Export PDF System ---

document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden'); // แสดงหน้าจอ Loading
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // เตรียม Content สำหรับ Export
        exportFrame.srcdoc = `
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>body { margin:0; padding:0; width:1280px; height:720px; overflow:hidden; }</style>
                </head>
                <body>${slide.content}</body>
            </html>
        `;
        
        // รอให้ Tailwind/Images โหลด (1 วินาที)
        await new Promise(r => setTimeout(r, 1000));

        // แปลง HTML เป็น Canvas
        const canvas = await html2canvas(exportFrame.contentDocument.body, {
            width: 1280,
            height: 720,
            scale: 1,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // ถ้าไม่ใช่หน้าแรก ให้เพิ่มหน้าใหม่ใน PDF
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
    }

    // ดาวน์โหลดไฟล์
    pdf.save('my-presentation.pdf');
    overlay.classList.add('hidden'); // ซ่อนหน้าจอ Loading
};

// --- 6. Initial Start ---
// เริ่มต้นระบบ
function init() {
    // กำหนดค่าเริ่มต้นใน Editor
    editor.value = slides[0].content;
    // แสดงโหมด Editor เป็นค่าเริ่มต้น
    document.getElementById('workspace').classList.add('view-editor');
    
    renderTabs();
    updatePreview();
}

init();
