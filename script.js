let slides = [{
    id: Date.now(),
    content: `<div class="w-[1280px] h-[720px] mx-auto flex flex-col justify-center items-center bg-[#0f172a] p-24 text-center relative overflow-hidden">
    <div class="absolute top-0 left-0 w-full h-2 bg-[#38bdf8]"></div>
    <h1 class="text-7xl font-bold text-white mb-4">ตรรกศาสตร์ (Logic)</h1>
    <p class="text-2xl text-gray-400">การศึกษาความจริงอย่างเป็นระบบ</p>
</div>`
}];

let activeSlideId = slides[0].id;

// Elements
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');

// --- Core Function: อัปเดต Preview ---
function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    activeSlide.content = editor.value;

    const fullDoc = `
        <html>
            <head>
                <meta name="viewport" content="width=1280">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { margin: 0; padding: 0; overflow: hidden; background: white; }</style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    setTimeout(fitSlide, 50); // ปรับ Scale หลังจากเนื้อหาโหลด
}

// --- Core Function: ปรับขนาดสไลด์ให้พอดีหน้าจอ (Auto Scale) ---
function fitSlide() {
    const padding = 40;
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    // อ้างอิงจาก 1280x720
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    const finalScale = scale > 1 ? 1 : scale; // ไม่ขยายเกินขนาดจริง
    
    wrapper.style.transform = `scale(${finalScale})`;
}

// --- UI Management ---
function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
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
        container.appendChild(tab);
    });
}

document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-white flex items-center justify-center text-4xl">สไลด์ใหม่</div>` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

// --- PDF Export ---
document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        exportFrame.srcdoc = `<html><head><script src="https://cdn.tailwindcss.com"></script></head><body>${slide.content}</body></html>`;
        
        await new Promise(r => setTimeout(r, 1000)); // รอ Tailwind Render

        const canvas = await html2canvas(exportFrame.contentDocument.body, {
            width: 1280, height: 720, scale: 1
        });
        
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }

    pdf.save('my-slides.pdf');
    overlay.classList.add('hidden');
};

// --- Init & Listeners ---
window.addEventListener('resize', fitSlide);
editor.oninput = updatePreview;
document.getElementById('btn-toggle-view').onclick = () => {
    document.getElementById('workspace').classList.toggle('view-preview');
    document.getElementById('workspace').classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
};

// Setup เริ่มต้น
document.getElementById('workspace').classList.add('view-editor');
editor.value = slides[0].content;
renderTabs();
updatePreview();
