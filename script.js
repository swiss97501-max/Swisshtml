let slides = [{ id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex items-center justify-center text-white text-5xl">เริ่มเขียนสไลด์แรก</div>` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// 🏆 1. PREVIEW FIX: คำนวณ Scale แบบ Absolute
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

// 🏆 ใช้ ResizeObserver เพื่อจับตาดูการเปลี่ยนขนาดจอแบบ Real-time
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
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: white; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// ==========================================
// 🆕🆕🆕 EXPORT PDF: DOWNLOAD โดยตรง (ไม่ใช้ Print)
// ==========================================
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const originalText = btn.innerHTML;
    
    try {
        // 1. แสดง Loading State
        btn.disabled = true;
        btn.innerHTML = '⏳';
        btn.style.opacity = '0.7';

        // 2. สร้าง container ชั่วคราวสำหรับ render สไลด์ทั้งหมด
        const exportContainer = document.getElementById('pdf-export-container');
        exportContainer.innerHTML = ''; // ล้างข้อมูลเก่า
        
        // 3. สร้าง div สำหรับแต่ละ slide
        slides.forEach((slide, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'pdf-slide';
            slideDiv.style.cssText = `
                width: 1280px;
                height: 720px;
                position: relative;
                background: white;
                margin-bottom: 20px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            
            // ใส่ content ของ slide (รวม Tailwind)
            slideDiv.innerHTML = `
                <!DOCTYPE html>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                </style>
                ${slide.content}
            `;
            
            exportContainer.appendChild(slideDiv);
        });

        // 4. รอให้ Tailwind render เสร็จ (ถ้ามี)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. สร้าง PDF object (A4 landscape หรือ 16:9 custom size)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1280, 720]
        });

        // 6. แปลงแต่ละ slide เป็นภาพแล้วเพิ่มลง PDF
        for (let i = 0; i < slides.length; i++) {
            const slideElement = exportContainer.children[i];
            
            // ใช้ html2canvas จับภาพ slide
            const canvas = await html2canvas(slideElement, {
                scale: 2, // ความละเอียดสูง (2x)
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            // แปลง canvas เป็น image data
            const imgData = canvas.toDataURL('image/png', 1.0);

            // เพิ่มลง PDF (ถ้าไม่ใช่ slide แรก ให้เพิ่มหน้าใหม่)
            if (i > 0) {
                pdf.addPage([1280, 720], 'landscape');
            }

            // วาดภาพลง PDF (เต็มหน้า)
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
        }

        // 7. ดาวน์โหลด PDF
        const fileName = `slides_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);

        // 8. แจ้งเตือนสำเร็จ
        alert(`✅ สร้าง PDF สำเร็จ!\nไฟล์: ${fileName}\nจำนวน: ${slides.length} สไลด์`);

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
        // 9. คืนค่าปุ่มเป็นปกติ
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        
        // ล้าง container
        document.getElementById('pdf-export-container').innerHTML = '';
    }
};

// --- การควบคุมระบบ UI ---
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-100 flex items-center justify-center text-gray-500 text-3xl">Slide ${slides.length + 1}</div>` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
    setTimeout(fitSlide, 100);
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
setTimeout(fitSlide, 100);
