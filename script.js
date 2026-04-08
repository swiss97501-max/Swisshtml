let slides = [{ id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex items-center justify-center text-white text-5xl">เริ่มเขียนสไลด์แรก</div>` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// 🏆 1. PREVIEW FIX: คำนวณ Scale แบบ Absolute
function fitSlide() {
    if (!previewArea || !wrapper) return;
    
    // หากพื้นที่แสดงผลโดนซ่อนอยู่ (เช่น บนมือถือตอนสลับจอ) ให้ข้ามไปก่อน
    if (previewArea.clientWidth === 0) return;

    // เผื่อระยะขอบซ้ายขวา 40px
    const padding = 40; 
    const availableWidth = previewArea.clientWidth - padding;
    const availableHeight = previewArea.clientHeight - padding;
    
    const scaleX = availableWidth / 1280;
    const scaleY = availableHeight / 720;
    
    // บังคับ Scale ไม่ให้เกิน 1
    let scale = Math.min(scaleX, scaleY, 1);
    
    // ใช้ translate(-50%, -50%) ร่วมกับ scale เพื่อให้สไลด์อยู่ตรงกลางเป๊ะๆ และไม่ล้นขอบ
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// 🏆 ใช้ ResizeObserver เพื่อจับตาดูการเปลี่ยนขนาดจอแบบ Real-time แม่นยำกว่า window.resize
const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(fitSlide);
});
if(previewArea) resizeObserver.observe(previewArea);

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
                    /* ล้างค่าเริ่มต้น ป้องกัน Scrollbar โผล่ใน iframe */
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: white; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// 🏆 2. PDF EXPORT FIX: บังคับการพิมพ์สี และรอ Tailwind 🏆
document.getElementById('btn-export').onclick = () => {
    // แจ้งเตือนผู้ใช้ (สำคัญมาก)
    alert("⚠️ สำคัญมาก!\nในหน้าต่าง Print ที่กำลังจะแสดงขึ้นมา โปรดตรวจสอบว่าได้ติ๊กเลือก 'Background graphics' (กราฟิกพื้นหลัง) แล้ว มิฉะนั้นสีและพื้นหลังจะหายไป");

    const printWin = window.open('', '_blank');
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    /* ตั้งขนาดหน้ากระดาษให้เป็นสัดส่วน 16:9 พอดี */
                    @page { size: 1280px 720px; margin: 0; }
                    
                    /* บังคับให้ Browser พิมพ์สีพื้นหลังออกมา (แก้ปัญหาหน้าขาว) */
                    html, body { 
                        margin: 0; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    
                    .slide { 
                        width: 1280px; 
                        height: 720px; 
                        page-break-after: always; 
                        position: relative; 
                        overflow: hidden; 
                    }
                }
            </style>
        </head>
        <body>
    `;
    
    slides.forEach(s => { html += `<div class="slide">${s.content}</div>`; });
    html += `</body></html>`;
    
    printWin.document.write(html);
    printWin.document.close();
    
    // ต้องรอให้ Tailwind โหลดและประมวลผล CSS ให้เสร็จ (ให้เวลา 1.5 วินาที)
    setTimeout(() => {
        printWin.print();
    }, 1500);
};

// --- การควบคุมระบบ UI ---
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
    // ให้เวลา CSS ทำงานนิดนึง แล้ว ResizeObserver จะจับได้เองว่าต้องคำนวณสเกลใหม่
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

// เริ่มต้นการทำงาน
editor.value = slides[0].content;
renderTabs();
updatePreview();
// คำนวณขนาดครั้งแรก
setTimeout(fitSlide, 100);
