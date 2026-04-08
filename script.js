/* ═══════════════════════════════════════════════════════════
SLIDE ENGINE — script.js
PDF export: html2canvas + jsPDF (ดาวน์โหลดตรง ไม่มี print)
═══════════════════════════════════════════════════════════ */

let slides = [{
id: Date.now(),
content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex flex-col items-center justify-center text-white gap-4">

  <div class="text-6xl font-bold tracking-tight">เริ่มเขียนสไลด์แรก</div>
  <div class="text-slate-400 text-xl">แก้ไข HTML / Tailwind ด้านซ้าย แล้วดูผลลัพธ์ที่นี่</div>
</div>`
}];
let activeSlideId = slides[0].id;

const editor       = document.getElementById(‘html-editor’);
const previewFrame = document.getElementById(‘preview-frame’);
const wrapper      = document.getElementById(‘canvas-wrapper’);
const previewArea  = document.querySelector(’.scale-anchor’);
const slideLabel   = document.getElementById(‘slide-label’);
const overlay      = document.getElementById(‘export-overlay’);
const exportStatus = document.getElementById(‘export-status’);
const exportFill   = document.getElementById(‘export-fill’);

/* ── PREVIEW SCALE ────────────────────────────────────────── */
function fitSlide() {
if (!previewArea || !wrapper) return;
if (previewArea.clientWidth === 0) return;
const pad = 32;
const scaleX = (previewArea.clientWidth  - pad) / 1280;
const scaleY = (previewArea.clientHeight - pad) / 720;
const scale  = Math.min(scaleX, scaleY, 1);
wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

new ResizeObserver(() => requestAnimationFrame(fitSlide)).observe(previewArea);

/* ── IFRAME CONTENT ───────────────────────────────────────── */
function buildIframeDoc(content) {
return `<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html,body{margin:0;padding:0;width:1280px;height:720px;overflow:hidden;background:#fff}
  </style>
</head>
<body>${content}</body>
</html>`;
}

function updatePreview() {
const slide = slides.find(s => s.id === activeSlideId);
if (!slide) return;
slide.content = editor.value;
previewFrame.srcdoc = buildIframeDoc(slide.content);
}

/* ── PDF EXPORT ───────────────────────────────────────────── */
function loadScript(src) {
return new Promise((resolve, reject) => {
if (document.querySelector(`script[src="${src}"]`)) return resolve();
const s = document.createElement(‘script’);
s.src = src;
s.onload  = resolve;
s.onerror = () => reject(new Error(’โหลดไม่ได้: ’ + src));
document.head.appendChild(s);
});
}

function renderSlideToDataURL(slideContent) {
return new Promise((resolve, reject) => {
const iframe = document.createElement(‘iframe’);
Object.assign(iframe.style, {
position: ‘fixed’,
left: ‘-9999px’,
top: ‘0’,
width: ‘1280px’,
height: ‘720px’,
border: ‘none’,
zIndex: ‘-1’,
});
document.body.appendChild(iframe);

```
    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    idoc.open();
    idoc.write(buildIframeDoc(slideContent));
    idoc.close();

    // รอ Tailwind โหลดและ render (~1.8 วิ)
    setTimeout(() => {
        html2canvas(idoc.body, {
            width: 1280,
            height: 720,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            windowWidth: 1280,
            windowHeight: 720,
            logging: false,
        }).then(canvas => {
            document.body.removeChild(iframe);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        }).catch(err => {
            document.body.removeChild(iframe);
            reject(err);
        });
    }, 1800);
});
```

}

function setProgress(pct, text) {
exportFill.style.width = pct + ‘%’;
exportStatus.textContent = text;
}

document.getElementById(‘btn-export’).onclick = async () => {
const btn = document.getElementById(‘btn-export’);
btn.disabled = true;
overlay.style.display = ‘flex’;
setProgress(0, ‘กำลังโหลดไลบรารี…’);

```
try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

    setProgress(5, 'เริ่มสร้าง PDF...');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720],
        hotfixes: ['px_scaling'],
        compress: true,
    });

    const total = slides.length;

    for (let i = 0; i < total; i++) {
        const pct = 5 + Math.round((i / total) * 90);
        setProgress(pct, `กำลัง render สไลด์ ${i + 1} / ${total}...`);

        const imgData = await renderSlideToDataURL(slides[i].content);

        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720, undefined, 'FAST');
    }

    setProgress(98, 'กำลังบันทึกไฟล์...');
    await new Promise(r => setTimeout(r, 300));

    pdf.save(`slides-${Date.now()}.pdf`);
    setProgress(100, 'ดาวน์โหลดเสร็จแล้ว ✓');
    await new Promise(r => setTimeout(r, 900));

} catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message);
    console.error(err);
} finally {
    overlay.style.display = 'none';
    setProgress(0, '');
    btn.disabled = false;
}
```

};

/* ── SLIDE MANAGEMENT ─────────────────────────────────────── */
function switchSlide(id) {
activeSlideId = id;
const slide = slides.find(s => s.id === id);
editor.value = slide.content;
previewFrame.srcdoc = buildIframeDoc(slide.content);
renderTabs();
updateSlideLabel();
}

function updateSlideLabel() {
const idx = slides.findIndex(s => s.id === activeSlideId);
if (slideLabel) slideLabel.textContent = `SLIDE ${idx + 1} / ${slides.length}`;
}

function renderTabs() {
const container = document.getElementById(‘tabs-container’);
container.innerHTML = ‘’;
slides.forEach((s, i) => {
const el = document.createElement(‘div’);
el.className = `tab${s.id === activeSlideId ? ' active' : ''}`;
el.textContent = i + 1;
el.title = `สไลด์ ${i + 1}`;
el.onclick = () => switchSlide(s.id);
container.appendChild(el);
});
updateSlideLabel();
}

document.getElementById(‘btn-add’).onclick = () => {
const newSlide = {
id: Date.now(),
content: `<div class="w-[1280px] h-[720px] bg-white flex items-center justify-center text-slate-300 text-2xl">สไลด์ใหม่</div>`
};
slides.push(newSlide);
switchSlide(newSlide.id);
};

document.getElementById(‘btn-swap’).onclick = () => {
document.querySelector(’.app’).classList.toggle(‘swap’);
};

editor.addEventListener(‘input’, updatePreview);

/* ── TAB KEY SUPPORT IN EDITOR ────────────────────────────── */
editor.addEventListener(‘keydown’, e => {
if (e.key === ‘Tab’) {
e.preventDefault();
const s = editor.selectionStart;
const v = editor.value;
editor.value = v.slice(0, s) + ’  ’ + v.slice(editor.selectionEnd);
editor.selectionStart = editor.selectionEnd = s + 2;
updatePreview();
}
});

/* ── INIT ─────────────────────────────────────────────────── */
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
