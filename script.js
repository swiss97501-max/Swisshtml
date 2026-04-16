let slides = [{ 
    id: Date.now(), 
    content: `
<div class="p-16 text-white font-['Sarabun'] h-full flex flex-col justify-start">
    <div class="flex items-start mb-6">
        <span class="text-orange-500 mr-2">▶</span>
        <p class="text-2xl font-bold text-yellow-400">
            กับดัก (Trap): <span class="text-white">ให้สูตรเป็นสารประกอบไอออนิก</span>
        </p>
    </div>
    <p class="text-2xl ml-10 mb-12">
        แต่ถามจำนวน <span class="text-3xl font-bold text-yellow-400">\\( Cr_2O_7^{2-} \\)</span>
    </p>

    <div class="flex items-start mb-6">
        <span class="text-orange-500 mr-2">▶</span>
        <p class="text-2xl font-bold text-yellow-400">
            โครงสร้าง: <span class="text-white">1 โมเลกุล \\( K_2Cr_2O_7 \\)</span>
        </p>
    </div>
    <p class="text-2xl ml-10">
        มี <span class="font-bold text-yellow-400">\\( K^+ \\)</span> 2 โมเลกุล และ 
        <span class="text-yellow-400 font-bold underline">\\( Cr_2O_7^{2-} \\) เพียง 1 โมเลกุล</span>
    </p>

    <div class="mt-auto bg-gray-800/50 p-6 rounded-xl border-l-4 border-orange-500">
        <p class="text-xl">
            ⚠️ <span class="text-yellow-400 font-bold">ไม่มีการแยก!</span> ไอออน 
            <span class="font-bold">\\( Cr_2O_7^{2-} \\)</span> อยู่เป็นหน่วยเดียว
        </p>
    </div>
</div>` 
}];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;
    const doc = `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: #0f172a; font-family: 'Sarabun', sans-serif; }
                </style>
            </head>
            <body>${slide.content}</body>
        </html>
    `;
    previewFrame.srcdoc = doc;
}

document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
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
                    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 0; background: #0f172a; font-family: 'Sarabun', sans-serif; width: 1280px; height: 720px; }
                    </style>
                </head>
                <body>${slide.content}</body>
                </html>
            `);
            frameDoc.close();

            // รอการโหลดที่จำเป็น
            await exportFrame.contentWindow.document.fonts.ready;
            if (exportFrame.contentWindow.MathJax) {
                await exportFrame.contentWindow.MathJax.typesetPromise();
            }
            await new Promise(r => setTimeout(r, 1000)); 

            const canvas = await html2canvas(frameDoc.body, {
                width: 1280, height: 720, scale: 2,
                useCORS: true, backgroundColor: '#0f172a',
                letterRendering: true
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
        btn.innerText = "↓"; btn.style.opacity = "1"; btn.style.pointerEvents = "auto";
    }
};

// --- ฟังก์ชันเสริมคงเดิม ---
document.getElementById('btn-add').onclick = () => {
    const newSlide = { id: Date.now(), content: `<div class="w-[1280px] h-[720px] bg-[#0f172a] flex items-center justify-center text-white text-4xl font-['Sarabun']">สไลด์ใหม่</div>` };
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

const resizeObserver = new ResizeObserver(() => requestAnimationFrame(fitSlide));
if(previewArea) resizeObserver.observe(previewArea);
editor.addEventListener('input', updatePreview);
document.getElementById('btn-swap').onclick = () => { document.querySelector('.app').classList.toggle('swap'); setTimeout(fitSlide, 100); };

// Start
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
