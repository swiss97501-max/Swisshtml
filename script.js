// --- 1. State ---
let slides = [{ id: Date.now(), content: `` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

// --- 2. Core Functions ---

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
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 1280px; height: 720px; }
                </style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    setTimeout(fitSlide, 50);
}

function fitSlide() {
    if (!previewPane) return;
    const padding = 30;
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    const finalScale = scale > 1 ? 1 : scale;
    
    wrapper.style.transform = `scale(${finalScale})`;
}

// ฟังก์ชันสร้าง Tabs พร้อมปุ่มลบ
function renderTabs() {
    tabsContainer.innerHTML = '';
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        
        const title = document.createElement('span');
        title.innerText = `หน้า ${i + 1}`;
        title.onclick = () => switchSlide(s.id);
        
        tab.appendChild(title);

        // ปุ่มลบหน้า (แสดงเมื่อมีมากกว่า 1 หน้า)
        if (slides.length > 1) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-del-tab';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteSlide(s.id);
            };
            tab.appendChild(delBtn);
        }

        tabsContainer.appendChild(tab);
    });
}

function switchSlide(id) {
    activeSlideId = id;
    const slide = slides.find(s => s.id === id);
    editor.value = slide.content;
    renderTabs();
    updatePreview();
}

function deleteSlide(id) {
    if (slides.length <= 1) return;
    if (!confirm('ยืนยันการลบหน้านี้?')) return;

    const index = slides.findIndex(s => s.id === id);
    slides = slides.filter(s => s.id !== id);

    if (activeSlideId === id) {
        activeSlideId = slides[Math.max(0, index - 1)].id;
    }
    switchSlide(activeSlideId);
}

// --- 3. Listeners ---

editor.addEventListener('input', updatePreview);

document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    switchSlide(newSlide.id);
};

document.getElementById('btn-toggle-view').onclick = () => {
    const workspace = document.getElementById('workspace');
    workspace.classList.toggle('view-preview');
    workspace.classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
};

window.addEventListener('resize', fitSlide);

// --- 4. Export PDF ---
document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        exportFrame.srcdoc = `
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>body { margin:0; padding:0; width:1280px; height:720px; overflow:hidden; }</style>
                </head>
                <body>${slides[i].content}</body>
            </html>
        `;
        await new Promise(r => setTimeout(r, 1000));
        const canvas = await html2canvas(exportFrame.contentDocument.body, { width: 1280, height: 720, scale: 1, useCORS: true });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }

    pdf.save('presentation.pdf');
    overlay.classList.add('hidden');
};

// --- Init ---
document.getElementById('workspace').classList.add('view-editor');
switchSlide(activeSlideId);
