let slides = [{ id: Date.now(), content: `` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.getElementById('preview-area');

// 🏆 แก้ Preview ไม่เต็มใบ 🏆
function fitSlide() {
    if (!previewArea || !wrapper) return;
    
    // เผื่อ Margin 5% ให้เห็นขอบสไลด์ชัดๆ
    const padding = 40;
    const availableWidth = previewArea.clientWidth - padding;
    const availableHeight = previewArea.clientHeight - padding;
    
    const scaleX = availableWidth / 1280;
    const scaleY = availableHeight / 720;
    
    // เลือก scale ที่น้อยที่สุดเพื่อให้ไม่หลุดจอ
    let scale = Math.min(scaleX, scaleY);
    if (scale > 1) scale = 1; // ไม่ขยายเกินขนาดจริง
    
    wrapper.style.transform = `scale(${scale})`;
}

function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;

    const doc = `
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: white; font-family: sans-serif; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
    requestAnimationFrame(fitSlide);
}

// 🏆 แก้ PDF องค์ประกอบหาย 🏆
// ใช้ Print Window แทน Library: จะเก็บ Blur, Gradient, Shadow ได้ครบ 100%
document.getElementById('btn-export').onclick = () => {
    const printWin = window.open('', '_blank');
    let html = `<html><head><script src="https://cdn.tailwindcss.com"></script><style>
        @media print {
            @page { size: 1280px 720px; margin: 0; }
            body { margin: 0; }
            .slide { width: 1280px; height: 720px; page-break-after: always; position: relative; overflow: hidden; }
        }
    </style></head><body>`;
    
    slides.forEach(s => {
        html += `<div class="slide">${s.content}</div>`;
    });
    
    html += `</body></html>`;
    printWin.document.write(html);
    printWin.document.close();
    
    setTimeout(() => {
        printWin.print();
        printWin.close();
    }, 1000); // รอ Tailwind โหลด 1 วินาที
};

// UI & Events
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = ``;
    render();
};

document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
    setTimeout(fitSlide, 50);
};

function render() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    slides.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        el.innerText = i + 1;
        el.onclick = () => {
            activeSlideId = s.id;
            editor.value = s.content;
            render();
            updatePreview();
        };
        container.appendChild(el);
    });
}

window.onresize = fitSlide;
editor.oninput = updatePreview;

// Init
editor.value = slides[0].content;
render();
updatePreview();
