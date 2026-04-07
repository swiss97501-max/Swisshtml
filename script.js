// --- 1. State Management ---
let slides = [{ 
    id: Date.now(), 
    content: `` // เริ่มต้นหน้าว่างสะอาดตา
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
 * ฟังก์ชันปรับขนาดสไลด์ให้พอดีหน้าจอ (Auto Scale)
 * รองรับการแสดงผลบน iPad และมือถือ ไม่ให้สไลด์ล้นขอบ
 */
function fitSlide() {
    const padding = 40; 
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    // อ้างอิงสัดส่วนทองคำของสไลด์ที่ 1280x720 (16:9)
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    
    // ย่อลงตามสัดส่วนจอ แต่ไม่ขยายเกิน 100%
    const finalScale = scale > 1 ? 1 : scale;
    
    wrapper.style.transform = `scale(${finalScale})`;
}

/**
 * ฟังก์ชัน Render เนื้อหาจาก Editor ลงใน iFrame
 * รองรับ Tailwind CSS และพื้นฐาน HTML เต็มรูปแบบ
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
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background-color: white; /* พื้นหลังเริ่มต้นเป็นสีขาว */
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
    
    previewFrame.srcdoc = fullDoc;
    
    // สั่งคำนวณ Scale ใหม่ทุกครั้งที่เนื้อหาเปลี่ยน
    setTimeout(fitSlide, 50);
}

/**
 * จัดการระบบ Tabs ด้านบน
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

// พิมพ์ปุ๊บ เปลี่ยนปั๊บ (Real-time)
editor.addEventListener('input', updatePreview);

// เพิ่มสไลด์ใหม่
document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

// ปุ่มสลับหน้าจอสำหรับอุปกรณ์พกพา
document.getElementById('btn-toggle-view').onclick = () => {
    const workspace = document.getElementById('workspace');
    workspace.classList.toggle('view-preview');
    workspace.classList.toggle('view-editor');
    setTimeout(fitSlide, 150);
};

window.addEventListener('resize', fitSlide);

// --- 5. Export PDF (High Quality) ---

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
                    <style>
                        body { margin:0; padding:0; width:1280px; height:720px; overflow:hidden; background: white; }
                    </style>
                </head>
                <body>
                    <div style="width:1280px; height:720px;">${slide.content}</div>
                </body>
            </html>
        `;
        
        // รอให้ Tailwind ประมวลผล Class ให้เสร็จ
        await new Promise(r => setTimeout(r, 1000));

        const canvas = await html2canvas(exportFrame.contentDocument.body, {
            width: 1280,
            height: 720,
            scale: 1,
            useCORS: true
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }

    pdf.save('presentation.pdf');
    overlay.classList.add('hidden');
};

// --- 6. Start ---
editor.value = slides[0].content;
renderTabs();
updatePreview();
