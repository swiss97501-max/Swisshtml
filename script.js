let slides = [{ id: Date.now(), content: `` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('iframe-wrapper');
const previewPane = document.getElementById('preview-pane');
const tabsContainer = document.getElementById('tabs-container');

function updatePreview() {
    const activeSlide = slides.find(s => s.id === activeSlideId);
    if (!activeSlide) return;
    activeSlide.content = editor.value;

    const fullDoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=1280">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { margin: 0; padding: 0; overflow: hidden; background: white; width: 1280px; height: 720px; }</style>
            </head>
            <body>${activeSlide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = fullDoc;
    setTimeout(fitSlide, 50);
}

function fitSlide() {
    const padding = 40;
    const availableWidth = previewPane.clientWidth - padding;
    const availableHeight = previewPane.clientHeight - padding;
    const scale = Math.min(availableWidth / 1280, availableHeight / 720);
    wrapper.style.transform = `scale(${scale > 1 ? 1 : scale})`;
}

// ฟังก์ชันลบสไลด์
function deleteSlide(id, event) {
    event.stopPropagation(); // กันไม่ให้กดโดน Tab หลัก
    if (slides.length <= 1) return; // ห้ามลบหน้าสุดท้าย

    const indexToRemove = slides.findIndex(s => s.id === id);
    slides = slides.filter(s => s.id !== id);

    // ถ้าลบหน้าที่กำลังดูอยู่ ให้ไปหน้าก่อนหน้า หรือหน้าแรก
    if (activeSlideId === id) {
        const nextSlide = slides[indexToRemove] || slides[indexToRemove - 1];
        activeSlideId = nextSlide.id;
        editor.value = nextSlide.content;
    }
    
    renderTabs();
    updatePreview();
}

function renderTabs() {
    tabsContainer.innerHTML = '';
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        
        const title = document.createElement('span');
        title.innerText = `Slide ${i + 1}`;
        tab.appendChild(title);

        // เพิ่มปุ่มลบ (แสดงเมื่อมีมากกว่า 1 หน้า)
        if (slides.length > 1) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-delete-tab';
            delBtn.innerText = '×';
            delBtn.onclick = (e) => deleteSlide(s.id, e);
            tab.appendChild(delBtn);
        }

        tab.onclick = () => {
            activeSlideId = s.id;
            editor.value = s.content;
            renderTabs();
            updatePreview();
        };
        tabsContainer.appendChild(tab);
    });
}

document.getElementById('btn-add-slide').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = ``;
    renderTabs();
    updatePreview();
};

document.getElementById('btn-export-pdf').onclick = async () => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'px', [1280, 720]);
    const exportFrame = document.getElementById('export-frame');

    for (let i = 0; i < slides.length; i++) {
        exportFrame.srcdoc = `<html><head><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;padding:0;width:1280px;height:720px;overflow:hidden;}</style></head><body>${slides[i].content}</body></html>`;
        await new Promise(r => setTimeout(r, 1000));
        const canvas = await html2canvas(exportFrame.contentDocument.body, { width: 1280, height: 720, scale: 1, useCORS: true });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1280, 720);
    }
    pdf.save('presentation.pdf');
    overlay.classList.add('hidden');
};

document.getElementById('btn-toggle-view').onclick = () => {
    document.getElementById('workspace').classList.toggle('view-preview');
    document.getElementById('workspace').classList.toggle('view-editor');
    setTimeout(fitSlide, 100);
};

window.addEventListener('resize', fitSlide);
editor.oninput = updatePreview;

// Initial
editor.value = slides[0].content;
document.getElementById('workspace').classList.add('view-editor');
renderTabs();
updatePreview();
