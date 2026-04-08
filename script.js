let slides = [{ id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex flex-col items-center justify-center text-white">
    <h1 class="text-6xl font-bold mb-4">Slide Engine</h1>
    <p class="text-xl text-slate-400">Export PDF แบบพื้นหลังไม่ขาว</p>
</div>` }];
let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// --- ระบบ Preview & Scaling ---
function fitSlide() {
    if (!previewArea || !wrapper || previewArea.clientWidth === 0) return;
    const padding = 40; 
    const scale = Math.min((previewArea.clientWidth - padding) / 1280, (previewArea.clientHeight - padding) / 720, 1);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

const resizeObserver = new ResizeObserver(() => requestAnimationFrame(fitSlide));
if(previewArea) resizeObserver.observe(previewArea);

function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;
    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: #000; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// --- 🏆 ระบบ PDF EXPORT แบบใหม่ (พื้นหลังไม่ขาว) 🏆 ---
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    // เปลี่ยน UI ปุ่มระหว่างประมวลผล
    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        
        // สร้างพื้นที่ลับสำหรับ Render สไลด์ (Off-screen)
        const renderContainer = document.createElement('div');
        renderContainer.style.position = 'fixed';
        renderContainer.style.top = '-9999px';
        renderContainer.style.width = '1280px';
        document.body.appendChild(renderContainer);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const div = document.createElement('div');
            div.style.width = '1280px';
            div.style.height = '720px';
            div.innerHTML = slide.content;
            renderContainer.appendChild(div);

            // รอ Tailwind ประมวลผลแป๊บนึง
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(div, {
                width: 1280,
                height: 720,
                scale: 2, // ชัดระดับ 2K
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage([1280, 720], 'l');
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            renderContainer.removeChild(div);
        }

        pdf.save(`presentation-${Date.now()}.pdf`);
        document.body.removeChild(renderContainer);
    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    } finally {
        btn.innerText = "↓";
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
};

// --- ระบบ UI & Tabs ---
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-slate-800 flex items-center justify-center text-white text-4xl">สไลด์ใหม่</div>` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

document.getElementById('btn-swap').onclick = () => document.querySelector('.app').classList.toggle('swap');

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
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
