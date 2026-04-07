let slides = [{ id: 1, content: '<h1>Slide 1</h1>' }];
let activeId = 1;

const editor = document.getElementById('html-editor');
const frame = document.getElementById('preview-frame');
const wrapper = document.getElementById('slide-wrapper');

// --- 1. Real-time Rendering ---
function updatePreview() {
    const slide = slides.find(s => s.id === activeId);
    slide.content = editor.value;

    const fullDoc = `
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    frame.srcdoc = fullDoc;
    autoScale();
}

// --- 2. Auto Scaling Logic ---
function autoScale() {
    const container = document.getElementById('preview-area');
    const winW = container.clientWidth - 60;
    const winH = container.clientHeight - 60;
    
    const scale = Math.min(winW / 1280, winH / 720);
    const finalScale = scale > 1 ? 1 : scale; // ไม่ขยายเกินขนาดจริง
    
    wrapper.style.transform = `scale(${finalScale})`;
    document.getElementById('zoom-text').innerText = Math.round(finalScale * 100) + "%";
}

window.addEventListener('resize', autoScale);
editor.addEventListener('input', updatePreview);

// --- 3. Professional PDF Export ---
document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);

    for (let i = 0; i < slides.length; i++) {
        // สร้าง Temporary Container เพื่อ Render สไลด์ขนาดเต็มสำหรับแคปภาพ
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '1280px';
        tempDiv.style.height = '720px';
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-2000px';
        tempDiv.innerHTML = slides[i].content;
        document.body.appendChild(tempDiv);

        // รอ Tailwind/Images render แป๊บหนึ่ง
        await new Promise(r => setTimeout(r, 400));

        const canvas = await html2canvas(tempDiv, {
            width: 1280, height: 720, scale: 2, // Scale 2 เพื่อความชัด
            useCORS: true
        });

        if (i > 0) pdf.addPage([1280, 720], 'l');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
        document.body.removeChild(tempDiv);
    }

    pdf.save('presentation.pdf');
    loader.classList.add('hidden');
});

// Init
editor.value = slides[0].content;
updatePreview();
renderTabs();

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = slides.map(s => `
        <div class="tab ${s.id === activeId ? 'active' : ''}" onclick="switchSlide(${s.id})">
            Slide ${slides.indexOf(s) + 1}
        </div>
    `).join('');
}

function switchSlide(id) {
    activeId = id;
    editor.value = slides.find(s => s.id === id).content;
    updatePreview();
    renderTabs();
}

document.getElementById('btn-add-slide').onclick = () => {
    const newId = Date.now();
    slides.push({ id: newId, content: '<div class="p-20"><h1>New Slide</h1></div>' });
    switchSlide(newId);
};
