// --- Configuration & State ---
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

let slides = [{
    id: Date.now(),
    html: `<div class="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-20">
    <div class="h-1 w-20 bg-sky-400 mb-8"></div>
    <h1 class="text-7xl font-bold mb-4">HTML SLIDE</h1>
    <p class="text-2xl text-slate-400">Professional Preview System</p>
</div>`
}];

let activeId = slides[0].id;
const editor = document.getElementById('code-editor');
const preview = document.getElementById('preview-iframe');
const wrapper = document.getElementById('canvas-wrapper');

// --- Core Functions ---

function updateIframe(targetIframe, content) {
    const fullDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;700&display=swap" rel="stylesheet">
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; font-family: 'Sarabun', sans-serif; width: ${BASE_WIDTH}px; height: ${BASE_HEIGHT}px; }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `;
    targetIframe.srcdoc = fullDoc;
}

function fitToScreen() {
    const container = document.getElementById('preview-container');
    const availableWidth = container.clientWidth - 60;
    const availableHeight = container.clientHeight - 60;

    const scale = Math.min(availableWidth / BASE_WIDTH, availableHeight / BASE_HEIGHT);
    const finalScale = scale > 1 ? 1 : scale; // ไม่ขยายเกิน 100%

    wrapper.style.transform = `scale(${finalScale})`;
}

function renderTabs() {
    const tabBar = document.getElementById('tab-bar');
    tabBar.innerHTML = '';
    slides.forEach((s, i) => {
        const t = document.createElement('div');
        t.className = `tab ${s.id === activeId ? 'active' : ''}`;
        t.innerHTML = `Slide ${i + 1}`;
        t.onclick = () => {
            activeId = s.id;
            editor.value = s.html;
            renderTabs();
            updateIframe(preview, s.html);
        };
        tabBar.appendChild(t);
    });
}

// --- Event Listeners ---

editor.addEventListener('input', () => {
    const slide = slides.find(s => s.id === activeId);
    slide.html = editor.value;
    updateIframe(preview, slide.html);
});

document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), html: '<div class="bg-white h-full p-20"><h1>New Slide</h1></div>' };
    slides.push(newSlide);
    activeId = newSlide.id;
    editor.value = newSlide.html;
    renderTabs();
    updateIframe(preview, newSlide.html);
};

// Export Logic
document.getElementById('btn-export').onclick = async () => {
    const loader = document.getElementById('loader');
    const workerFrame = document.getElementById('export-iframe');
    loader.classList.remove('hidden');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape', 'px', [BASE_WIDTH, BASE_HEIGHT]);

    for (let i = 0; i < slides.length; i++) {
        updateIframe(workerFrame, slides[i].html);
        
        await new Promise(r => {
            workerFrame.onload = () => setTimeout(r, 800); // รอ Tailwind/Fonts render
        });

        const canvas = await html2canvas(workerFrame.contentDocument.body, {
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            scale: 2 // เพิ่มความคมชัดเป็น 2 เท่า
        });

        const img = canvas.toDataURL('image/jpeg', 0.9);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, 0, BASE_WIDTH, BASE_HEIGHT);
    }

    pdf.save('my-slides.pdf');
    loader.classList.add('hidden');
};

// Mobile Navigation
const layout = document.getElementById('main-layout');
layout.classList.add('show-editor');
document.getElementById('toggle-view').onclick = () => {
    layout.classList.toggle('show-editor');
    layout.classList.toggle('show-preview');
    setTimeout(fitToScreen, 50);
};

// Init
window.addEventListener('resize', fitToScreen);
editor.value = slides[0].html;
renderTabs();
updateIframe(preview, slides[0].html);
setTimeout(fitToScreen, 100);
