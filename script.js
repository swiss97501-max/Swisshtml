let slides = [{ 
    id: Date.now(), 
    content: `` 
}];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// --- ระบบ Preview ---
function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;
    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: #0f172a; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

// --- 🏆 ฟังก์ชัน Export PDF (แก้ปัญหาพื้นขาว) 🏆 ---
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        
        // 1. สร้าง Iframe ลับเพื่อเรนเดอร์ Tailwind
        const exportFrame = document.createElement('iframe');
        exportFrame.style.visibility = 'hidden';
        exportFrame.style.position = 'fixed';
        exportFrame.style.width = '1280px';
        exportFrame.style.height = '720px';
        document.body.appendChild(exportFrame);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const frameDoc = exportFrame.contentDocument || exportFrame.contentWindow.document;

            // 2. เขียน HTML ลงไปใน Iframe เพื่อให้ Tailwind ในนั้นทำงาน
            frameDoc.open();
            frameDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 0; background: #0f172a; }
                    </style>
                </head>
                <body>${slide.content}</body>
                </html>
            `);
            frameDoc.close();

            // 3. รอให้ Tailwind และ Fonts โหลดเสร็จ (สำคัญมาก!)
            await new Promise(r => setTimeout(r, 1200)); 

            // 4. ถ่ายรูปจาก Body ของ Iframe
            const canvas = await html2canvas(frameDoc.body, {
                width: 1280,
                height: 720,
                scale: 2,
                useCORS: true,
                backgroundColor: null // ให้ใช้ตาม CSS ใน Iframe
            });

            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage([1280, 720], 'l');
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
        }

        pdf.save(`presentation.pdf`);
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

// --- ฟังก์ชันเสริม (Tabs/Add) ---
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-[#0f172a] flex items-center justify-center text-white text-4xl">สไลด์ใหม่</div>` };
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

// ระบบ Scale
function fitSlide() {
    if (!previewArea || !wrapper || previewArea.clientWidth === 0) return;
    const scale = Math.min((previewArea.clientWidth - 40) / 1280, (previewArea.clientHeight - 40) / 720, 1);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

const resizeObserver = new ResizeObserver(() => requestAnimationFrame(fitSlide));
if(previewArea) resizeObserver.observe(previewArea);
editor.addEventListener('input', updatePreview);
document.getElementById('btn-swap').onclick = () => { document.querySelector('.app').classList.toggle('swap'); setTimeout(fitSlide, 100); };

// Start
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
