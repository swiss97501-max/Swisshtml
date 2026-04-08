let slides = [{ 
    id: Date.now(), 
    content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex items-center justify-center text-white text-5xl">เริ่มเขียนสไลด์แรก</div>` 
}];

let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// ฟังก์ชันคำนวณขนาดสไลด์ให้พอดีจอ
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

// ResizeObserver สำหรับปรับขนาดอัตโนมัติ
const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(fitSlide);
});
if (previewArea) resizeObserver.observe(previewArea);

// อัพเดท Preview
function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    if (!slide) return;
    slide.content = editor.value;

    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    html, body { 
                        margin: 0; 
                        padding: 0; 
                        width: 1280px; 
                        height: 720px; 
                        overflow: hidden; 
                        background: white; 
                    }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// ==================== ดาวน์โหลด PDF ====================
document.getElementById('btn-export').onclick = async () => {
    if (slides.length === 0) {
        alert("ไม่มีสไลด์ให้ดาวน์โหลด");
        return;
    }

    const btn = document.getElementById('btn-export');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳";
    btn.disabled = true;

    try {
        alert("กำลังสร้าง PDF...\n\nอาจใช้เวลา 3-8 วินาที ขึ้นกับจำนวนสไลด์");

        // สร้าง container ชั่วคราวสำหรับ render PDF
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-99999px';
        pdfContainer.style.top = '0';
        pdfContainer.style.width = '1280px';
        document.body.appendChild(pdfContainer);

        for (let slide of slides) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'pdf-slide';
            slideDiv.style.width = '1280px';
            slideDiv.style.height = '720px';
            slideDiv.style.marginBottom = '40px';
            slideDiv.style.background = '#ffffff';
            slideDiv.style.overflow = 'hidden';
            slideDiv.style.pageBreakAfter = 'always';

            slideDiv.innerHTML = `
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    html, body, .pdf-slide {
                        margin: 0;
                        padding: 0;
                        width: 1280px;
                        height: 720px;
                        overflow: hidden;
                        background: white;
                    }
                    * { box-sizing: border-box; }
                </style>
                ${slide.content}
            `;

            pdfContainer.appendChild(slideDiv);
            
            // รอ Tailwind ประมวลผล
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        const opt = {
            margin: 0,
            filename: `my-slides_${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,           // คุณภาพดี (1.5 = เร็วขึ้น, 3 = คุณภาพสูงสุด)
                useCORS: true,
                allowTaint: true,
                letterRendering: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'px',
                format: [1280, 720],
                orientation: 'landscape'
            }
        };

        await html2pdf().set(opt).from(pdfContainer).save();

        document.body.removeChild(pdfContainer);
        alert("✅ ดาวน์โหลด PDF เสร็จเรียบร้อยแล้ว!");

    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF\nกรุณาลองใหม่อีกครั้ง");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// เพิ่มสไลด์ใหม่
document.getElementById('btn-add').onclick = () => {
    const newSlide = { 
        id: Date.now(), 
        content: `<div class="w-[1280px] h-[720px] bg-slate-100 flex items-center justify-center text-slate-400 text-4xl">สไลด์ใหม่</div>` 
    };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

// สลับหน้าจอ (มือถือ)
document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
};

// Render Tabs
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

// เริ่มต้นระบบ
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
