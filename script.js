let slides = [{ 
    id: Date.now(), 
    content: `<div class="w-full h-full bg-[#1e3a8a] text-white p-12 font-sarabun">
    <div class="mb-6">
        <p class="text-yellow-300 text-xl mb-2">▶ ฟัง (Trap): เป็นการรับอิเล็กตรอนเข้ามา</p>
        <p class="text-white text-lg ml-6 mb-4">
            ตัวอย่าง: <span class="text-yellow-300 font-semibold">Cr<sub>2</sub>O<sub>7</sub><sup>2-</sup></span>
        </p>
        <p class="text-white text-lg ml-6">
            โดยรับ: 1 อิเล็กตรอน → K<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub><br>
            รับ K<sup>+</sup> 2 อิเล็กตรอน → Cr<sub>2</sub>O<sub>7</sub><sup>2-</sup> เหลือ 1 อิเล็กตรอน
        </p>
    </div>
    <div class="mt-8 p-4 bg-red-900/30 border-l-4 border-red-500 rounded">
        <p class="text-yellow-300 text-lg">⚠️ หมายเหตุ ไอออน Cr<sub>2</sub>O<sub>7</sub><sup>2-</sup> สำคัญมากในเคมี</p>
    </div>
</div>` 
}];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');
const exportContainer = document.getElementById('export-container');

// --- ระบบ Preview ---
function generateSlideHTML(content) {
    return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sarabun: ['Sarabun', 'sans-serif'],
                    }
                }
            }
        }
    <\/script>
    <style>
        * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            width: 1280px;
            height: 720px;
            overflow: hidden;
            background: #1e3a8a;
            font-family: 'Sarabun', sans-serif;
        }
        
        /* Support for chemical formulas */
        sub, sup {
            font-size: 0.75em;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
        }
        
        sup {
            top: -0.5em;
        }
        
        sub {
            bottom: -0.25em;
        }
        
        /* Ensure proper rendering of all elements */
        .w-full { width: 100%; }
        .h-full { height: 100%; }
    </style>
</head>
<body>${content}</body>
</html>`;
}

function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    if (slide) {
        slide.content = editor.value;
    }
    const doc = generateSlideHTML(editor.value || slides.find(s => s.id === activeSlideId)?.content || '');
    previewFrame.srcdoc = doc;
}

// --- 🏆 ฟังก์ชัน Export PDF (แก้ไขใหม่ - ถูกต้อง 100%) 🏆 ---
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            // 1. สร้าง div ชั่วคราวสำหรับ rendering
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                width: 1280px;
                height: 720px;
                background: #1e3a8a;
                z-index: -9999;
            `;
            tempDiv.innerHTML = generateSlideHTML(slide.content);
            document.body.appendChild(tempDiv);

            // 2. รอให้ทุกอย่าง render เสร็จ (Fonts, Tailwind, Images)
            await waitForResources(tempDiv);
            
            // 3. รอเพิ่มเติมเพื่อความแน่ใจ
            await new Promise(resolve => setTimeout(resolve, 500));

            // 4. ถ่ายรูปด้วย html2canvas พร้อม options ที่เหมาะสม
            const canvas = await html2canvas(tempDiv, {
                width: 1280,
                height: 720,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#1e3a8a',
                logging: false,
                imageTimeout: 15000,
                onclone: function(clonedDoc) {
                    // Ensure fonts are loaded in cloned document
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        * {
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                        }
                        body {
                            font-family: 'Sarabun', sans-serif !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            
            if (i > 0) {
                pdf.addPage([1280, 720], 'l');
            }
            
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            // 5. ลบ div ชั่วคราว
            document.body.removeChild(tempDiv);
        }

        pdf.save(`presentation_${new Date().toISOString().slice(0,10)}.pdf`);
        
    } catch (err) {
        console.error('Export Error:', err);
        alert("Export failed! Please check console for details.");
    } finally {
        btn.innerText = "↓";
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
};

// --- ฟังก์ชันรอให้ Resources โหลดเสร็จ ---
async function waitForResources(element) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkReady = () => {
            attempts++;
            
            // Check if fonts are ready
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    setTimeout(resolve, 300);
                });
            } else {
                // Fallback: just wait
                if (attempts >= maxAttempts) {
                    resolve();
                } else {
                    setTimeout(checkReady, 200);
                }
            }
        };
        
        // Initial delay to let DOM settle
        setTimeout(checkReady, 200);
    });
}

// --- ฟังก์ชันเสริม (Tabs/Add) ---
document.getElementById('btn-add').onclick = () => {
    const newSlide = { 
        id: Date.now(), 
        content: `<div class="w-full h-full bg-[#1e3a8a] text-white p-12 font-sarabun flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-5xl font-bold mb-4">สไลด์ใหม่</h1>
        <p class="text-xl opacity-80">เพิ่มเนื้อหาของคุณที่นี่</p>
    </div>
</div>` 
    };
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
            // Save current slide content before switching
            const currentSlide = slides.find(sl => sl.id === activeSlideId);
            if (currentSlide) {
                currentSlide.content = editor.value;
            }
            
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

// Auto-save on input with debounce
let inputTimeout;
editor.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
        updatePreview();
    }, 150); // Small debounce for better performance
});

document.getElementById('btn-swap').onclick = () => { 
    document.querySelector('.app').classList.toggle('swap'); 
    setTimeout(fitSlide, 100); 
};

// Start
editor.value = slides[0].content;
renderTabs();
updatePreview();

// Initial fit after everything loads
window.addEventListener('load', () => {
    setTimeout(fitSlide, 200);
});

setTimeout(fitSlide, 100);
