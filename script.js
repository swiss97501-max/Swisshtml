// 1. ข้อมูลเริ่มต้น (ตัวอย่างสไลด์ที่สวยงามและโครงสร้างที่ถูกต้อง)
let slides = [{ 
    id: Date.now(), 
    content: `<div class="w-[1280px] h-[720px] flex flex-col justify-center items-center bg-[#0f172a] p-24 text-center relative overflow-hidden text-white" style="font-family: 'Sarabun', sans-serif;">
    <div class="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
    <h1 class="text-7xl font-bold mb-6 text-blue-400" style="font-family: 'Playfair Display', serif;">Logic & Tables</h1>
    <div class="p-8 border-2 border-blue-500/30 bg-white/5 rounded-2xl">
        <table class="text-3xl border-collapse">
            <tr>
                <td class="p-6 border border-white/20">A</td>
                <td class="p-6 border border-white/20">B</td>
                <td class="p-6 border border-white/20">A ∧ B</td>
            </tr>
            <tr>
                <td class="p-6 border border-white/20">T</td>
                <td class="p-6 border border-white/20">T</td>
                <td class="p-6 border border-white/20 text-green-400">T</td>
            </tr>
        </table>
    </div>
</div>` 
}];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// 2. ระบบ Update Preview
function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    if (!slide) return;
    slide.content = editor.value;

    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: #000; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// 3. 🏆 ระบบ Export PDF (The Ultimate Fix) 🏆
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        
        // สร้าง Iframe ลับเพื่อเรนเดอร์ Tailwind แบบสมบูรณ์
        const exportFrame = document.createElement('iframe');
        exportFrame.style.visibility = 'hidden';
        exportFrame.style.position = 'fixed';
        exportFrame.style.width = '1280px';
        exportFrame.style.height = '720px';
        document.body.appendChild(exportFrame);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const frameDoc = exportFrame.contentDocument || exportFrame.contentWindow.document;

            frameDoc.open();
            frameDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 0; background: #000; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    </style>
                </head>
                <body>${slide.content}</body>
                </html>
            `);
            frameDoc.close();

            // รอ Tailwind และ Fonts โหลด (สำคัญมากสำหรับความชัด)
            await new Promise(r => setTimeout(r, 1500)); 

            const canvas = await html2canvas(frameDoc.body, {
                width: 1280,
                height: 720,
                scale: 2, // ชัดระดับ 2K
                useCORS: true,
                backgroundColor: null 
            });

            if (i > 0) pdf.addPage([1280, 720], 'l');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1280, 720);
        }

        pdf.save(`slide-${Date.now()}.pdf`);
        document.body.removeChild(exportFrame);
    } catch (err) {
        console.error(err);
        alert("Export failed!");
    } finally {
        btn.innerText = "↓";
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
};

// 4. ระบบจัดการ UI (Tabs, Add, Swap)
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-[#0f172a] flex items-center justify-center text-white text-5xl font-bold">Slide ${slides.length + 1}</div>` };
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
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

function fitSlide() {
    if (!previewArea || !wrapper || previewArea.clientWidth === 0) return;
    const scale = Math.min((previewArea.clientWidth - 40) / 1280, (previewArea.clientHeight - 40) / 720, 1);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// Event Listeners
const resizeObserver = new ResizeObserver(() => requestAnimationFrame(fitSlide));
if(previewArea) resizeObserver.observe(previewArea);
editor.addEventListener('input', updatePreview);
document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
    setTimeout(fitSlide, 100);
};

// Start App
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
