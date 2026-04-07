// 1. State Management
let slides = [
    {
        id: Date.now(),
        content: `
<div class="w-[1280px] h-[720px] mx-auto flex flex-col justify-center items-center bg-[#0f172a] p-24 text-center relative overflow-hidden">
    <div class="absolute top-0 left-0 w-full h-2 bg-[#38bdf8]"></div>
    <div class="relative z-10 mb-10">
        <div class="w-24 h-1 bg-[#38bdf8] mx-auto mb-8"></div>
        <h1 class="text-6xl font-bold text-white tracking-tight">ตรรกศาสตร์ (Logic)</h1>
    </div>
    <p class="relative z-10 text-xl text-gray-400 font-light leading-relaxed">
        การศึกษาการให้เหตุผลอย่างเป็นระบบ<br/>
        เพื่อแยกแยะ "ความจริง" ออกจาก "ความคลาดเคลื่อน"
    </p>
</div>`
    }
];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');

// 2. ฟังก์ชัน Fit Slide (หัวใจของการแก้ปัญหาจอ iPad/Mobile)
function fitSlide() {
    if (!wrapper || !previewPane) return;
    
    const padding = 20; 
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    const baseWidth = 1280;
    const baseHeight = 720;
    
    // คำนวณ Scale ที่ทำให้สัดส่วนไม่เสีย
    const scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
    
    // ย่อ Wrapper ลงตามอัตราส่วนหน้าจอ
    wrapper.style.transform = `scale(${scale > 1 ? 1 : scale})`;
}

// 3. Render Logic
function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    activeSlide.content = editor.value;

    const docContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=1280">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { margin: 0; padding: 0; overflow: hidden; background: #000; }
            </style>
        </head>
        <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = docContent;
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    slides.forEach((slide, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${slide.id === activeSlideId ? 'active' : ''}`;
        tab.innerHTML = `
            <span onclick="switchSlide(${slide.id})">Slide ${index + 1}</span>
            ${slides.length > 1 ? `<button class="tab-delete" onclick="deleteSlide(${slide.id})">×</button>` : ''}
        `;
        container.appendChild(tab);
    });
}

function switchSlide(id) {
    activeSlideId = id;
    const activeSlide = slides.find(s => s.id === id);
    editor.value = activeSlide.content;
    updatePreview();
    renderTabs();
    setTimeout(fitSlide, 50);
}

function addSlide() {
    const newSlide = {
        id: Date.now(),
        content: `<div class="w-[1280px] h-[720px] flex items-center justify-center bg-white text-black"><h1>หน้าใหม่</h1></div>`
    };
    slides.push(newSlide);
    switchSlide(newSlide.id);
}

function deleteSlide(id) {
    slides = slides.filter(s => s.id !== id);
    if (activeSlideId === id) activeSlideId = slides[0].id;
    switchSlide(activeSlideId);
}

// 4. Export PDF
document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        const content = `
            <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; }</style>
            </head>
            <body>${slides[i].content}</body>
            </html>
        `;
        exportFrame.srcdoc = content;
        
        await new Promise(res => {
            exportFrame.onload = () => setTimeout(res, 800); // รอ Tailwind Render
        });

        const canvas = await html2canvas(exportFrame.contentDocument.body, {
            width: 1280, height: 720, scale: 1
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }

    pdf.save('my-presentation.pdf');
    overlay.classList.add('hidden');
});

// 5. Events
editor.addEventListener('input', updatePreview);
document.getElementById('btn-add-slide').addEventListener('click', addSlide);
window.addEventListener('resize', fitSlide);

document.getElementById('btn-toggle-view').addEventListener('click', () => {
    const ws = document.getElementById('workspace');
    ws.classList.toggle('view-preview');
    ws.classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
});

// Init
document.getElementById('workspace').classList.add('view-editor');
switchSlide(activeSlideId);
