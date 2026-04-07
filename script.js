let slides = [{ id: Date.now(), content: `<div style="padding:50px; text-align:center; font-size:40px;">Slide 1</div>` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

// --- Render Logic ---
function renderTabs() {
    tabsContainer.innerHTML = '';
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        
        tab.innerHTML = `
            <span class="tab-label">P.${i + 1}</span>
            <div class="tab-actions">
                <button class="btn-mini" onclick="moveSlide(${i}, -1); event.stopPropagation();">◀</button>
                <button class="btn-mini" onclick="moveSlide(${i}, 1); event.stopPropagation();">▶</button>
                <button class="btn-mini btn-del" onclick="deleteSlide(${s.id}); event.stopPropagation();">✕</button>
            </div>
        `;

        tab.onclick = () => {
            activeSlideId = s.id;
            editor.value = s.content;
            renderTabs();
            updatePreview();
        };
        tabsContainer.appendChild(tab);
    });
}

function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (!activeSlide) return;
    activeSlide.content = editor.value;

    const fullDoc = `<html><head><meta name="viewport" content="width=1280"><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;padding:0;overflow:hidden;background:white;width:1280px;height:720px;}</style></head><body>${activeSlide.content}</body></html>`;
    previewFrame.srcdoc = fullDoc;
    setTimeout(fitSlide, 50);
}

function fitSlide() {
    const padding = 40;
    const scale = Math.min((previewPane.clientWidth - padding) / 1280, (previewPane.clientHeight - padding) / 720);
    wrapper.style.transform = `scale(${scale > 1 ? 1 : scale})`;
}

// --- Management Functions ---
function deleteSlide(id) {
    if (slides.length <= 1) return;
    slides = slides.filter(s => s.id !== id);
    if (activeSlideId === id) activeSlideId = slides[0].id;
    editor.value = slides.find(s => s.id === activeSlideId).content;
    renderTabs();
    updatePreview();
}

function moveSlide(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const element = slides.splice(index, 1)[0];
    slides.splice(newIndex, 0, element);
    renderTabs();
}

document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = '';
    renderTabs();
    updatePreview();
};

// --- Export PDF ---
document.getElementById('btn-export-pdf').onclick = async () => {
    document.getElementById('loading-overlay').classList.remove('hidden');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        exportFrame.srcdoc = `<html><head><script src="https://cdn.tailwindcss.com"></script></head><body>${slides[i].content}</body></html>`;
        await new Promise(r => setTimeout(r, 1000));
        const canvas = await html2canvas(exportFrame.contentDocument.body, { width: 1280, height: 720, scale: 1 });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1280, 720);
    }
    pdf.save('presentation.pdf');
    document.getElementById('loading-overlay').classList.add('hidden');
};

// --- Init ---
window.addEventListener('resize', fitSlide);
editor.oninput = updatePreview;
document.getElementById('btn-toggle-view').onclick = () => {
    document.getElementById('workspace').classList.toggle('view-preview');
    document.getElementById('workspace').classList.toggle('view-editor');
    setTimeout(fitSlide, 150);
};

// เริ่มต้นหน้าจอ
document.getElementById('workspace').classList.add('view-editor');
editor.value = slides[0].content;
renderTabs();
updatePreview();
