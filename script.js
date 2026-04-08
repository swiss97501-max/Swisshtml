let slides = [
    {
        id: Date.now(),
        content: `<div class="w-[1280px] h-[720px] bg-slate-900 flex items-center justify-center text-white text-5xl">Slide 1</div>`
    }
];

let activeSlideId = slides[0].id;

const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');


// =========================
// PREVIEW SCALE
// =========================
function fitSlide() {
    if (!previewArea) return;

    const padding = 40;

    const scaleX = (previewArea.clientWidth - padding) / 1280;
    const scaleY = (previewArea.clientHeight - padding) / 720;

    const scale = Math.min(scaleX, scaleY, 1);

    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

new ResizeObserver(() => requestAnimationFrame(fitSlide)).observe(previewArea);


// =========================
// UPDATE PREVIEW
// =========================
function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    slide.content = editor.value;

    const doc = `
    <html>
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            html, body {
                margin:0;
                width:1280px;
                height:720px;
                overflow:hidden;
            }
        </style>
    </head>
    <body>${slide.content}</body>
    </html>
    `;

    previewFrame.srcdoc = doc;
}


// =========================
// ✅ EXPORT PDF (NEW CORE)
// =========================
document.getElementById('btn-export').onclick = async () => {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720]
    });

    for (let i = 0; i < slides.length; i++) {

        const temp = document.createElement('div');
        temp.style.width = "1280px";
        temp.style.height = "720px";
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        temp.innerHTML = slides[i].content;

        document.body.appendChild(temp);

        // รอ Tailwind render
        await new Promise(r => setTimeout(r, 300));

        const canvas = await html2canvas(temp, {
            width: 1280,
            height: 720,
            scale: 2
        });

        const img = canvas.toDataURL("image/png");

        if (i > 0) pdf.addPage([1280, 720], "landscape");

        pdf.addImage(img, "PNG", 0, 0, 1280, 720);

        document.body.removeChild(temp);
    }

    pdf.save("slides.pdf");
};


// =========================
// UI CONTROLS
// =========================
document.getElementById('btn-add').onclick = () => {
    const s = {
        id: Date.now(),
        content: `<div class="w-[1280px] h-[720px] bg-white"></div>`
    };

    slides.push(s);
    activeSlideId = s.id;

    editor.value = s.content;

    renderTabs();
    updatePreview();
};


document.getElementById('btn-swap').onclick = () => {
    document.querySelector('.app').classList.toggle('swap');
};


// =========================
// TABS
// =========================
function renderTabs() {
    const c = document.getElementById('tabs-container');
    c.innerHTML = '';

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

        c.appendChild(el);
    });
}


// =========================
// INIT
// =========================
editor.value = slides[0].content;
renderTabs();
updatePreview();

setTimeout(fitSlide, 100);
