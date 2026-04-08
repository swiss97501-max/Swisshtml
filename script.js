let slides = [{ id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex items-center justify-center text-white text-5xl">เริ่มเขียนสไลด์แรก</div>` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// คำนวณ Scale สำหรับพรีวิว
function fitSlide() {
    if (!previewArea || !wrapper) return;
    if (previewArea.clientWidth === 0) return;

    const padding = 40;
    const availableWidth = previewArea.clientWidth - padding;
    const availableHeight = previewArea.clientHeight - padding;

    const scaleX = availableWidth / 1280;
    const scaleY = availableHeight / 720;
    let scale = Math.min(scaleX, scaleY, 1);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(fitSlide);
});
if (previewArea) resizeObserver.observe(previewArea);

function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;

    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: white; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// 🏆 EXPORT PDF โดยตรง (ไม่ผ่าน Print Dialog) 🏆
document.getElementById('btn-export').onclick = () => {
    // สร้าง container ชั่วคราวสำหรับ render PDF
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '1280px';
    pdfContainer.style.backgroundColor = 'white';
    pdfContainer.style.zIndex = '-9999';

    // เพิ่มแต่ละสไลด์ลงใน container
    slides.forEach(slide => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide';
        slideDiv.style.width = '1280px';
        slideDiv.style.height = '720px';
        slideDiv.style.position = 'relative';
        slideDiv.style.overflow = 'hidden';
        slideDiv.innerHTML = slide.content;
        pdfContainer.appendChild(slideDiv);
    });

    document.body.appendChild(pdfContainer);

    // รอให้ DOM และ Tailwind เรนเดอร์
    setTimeout(() => {
        const opt = {
            margin: 0,
            filename: 'slides.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'px', format: [1280, 720], orientation: 'landscape' }
        };

        html2pdf().set(opt).from(pdfContainer).save().then(() => {
            document.body.removeChild(pdfContainer);
        }).catch(err => {
            console.error('PDF error:', err);
            document.body.removeChild(pdfContainer);
            alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองอีกครั้ง');
        });
    }, 500);
};

// UI Events
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-100"></div>` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
};

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    slides.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        el.innerText = i + 1;
        el.onclick = () => {
            activeSlideId = s.id;
            editor.value = s.content;
            renderTabs();
            updatePreview();
        };
        container.appendChild(el);
    });
}

editor.addEventListener('input', updatePreview);

// เริ่มต้น
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
