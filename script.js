const editor = document.getElementById('html-editor');
const previewFrame = document.getElementById('preview-frame');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

let slides = [
  { id: Date.now(), content: '<div class="w-[1280px] h-[720px] bg-slate-100"></div>' }
];
let activeSlideId = slides[0].id;

// ฟังก์ชันปรับสเกล preview
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

const resizeObserver = new ResizeObserver(() => {
  requestAnimationFrame(fitSlide);
});
if (previewArea) resizeObserver.observe(previewArea);

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
          html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: white; }
        </style>
      </head>
      <body>${slide.content}</body>
    </html>
  `;
  previewFrame.srcdoc = doc;
}

// Export PDF โดยตรง
document.getElementById('btn-export').onclick = () => {
  const container = document.createElement('div');
  slides.forEach(s => {
    const slideDiv = document.createElement('div');
    slideDiv.className = "slide";
    slideDiv.style.width = "1280px";
    slideDiv.style.height = "720px";
    slideDiv.innerHTML = s.content;
    container.appendChild(slideDiv);
  });

  const opt = {
    margin: 0,
    filename: 'slides.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'px', format: [1280, 720], orientation: 'landscape' }
  };

  html2pdf().set(opt).from(container).save();
};

// เพิ่ม slide ใหม่
document.getElementById('btn-add').onclick = () => {
  const newSlide = { id: Date.now(), content: '<div class="w-[1280px] h-[720px] bg-slate-100"></div>' };
  slides.push(newSlide);
  activeSlideId = newSlide.id;
  editor.value = newSlide.content;
  renderTabs();
  updatePreview();
};

document.getElementById('btn-swap').onclick = () => {
  document.querySelector('.app').classList.toggle('swap');
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

// เริ่มต้น
editor.value = slides[0].content;
renderTabs();
updatePreview();
setTimeout(fitSlide, 100);
