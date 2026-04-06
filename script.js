let slides = [
  `<h1>Hello Slide</h1><p>Start editing...</p>`
];

let current = 0;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");

/* ===== INIT ===== */
function init() {
  renderTabs();
  loadSlide();
}

/* ===== LOAD SLIDE ===== */
function loadSlide() {
  editor.value = slides[current];
  renderPreview();
}

/* ===== RENDER PREVIEW (REAL) ===== */
function renderPreview() {
  preview.srcdoc = slides[current];
}

/* ===== UPDATE EDITOR ===== */
editor.addEventListener("input", () => {
  slides[current] = editor.value;
  renderPreview();
});

/* ===== ADD SLIDE ===== */
function addSlide() {
  slides.push("<h1>New Slide</h1>");
  current = slides.length - 1;
  renderTabs();
  loadSlide();
}

/* ===== SWITCH TAB ===== */
function switchSlide(i) {
  current = i;
  renderTabs();
  loadSlide();
}

/* ===== RENDER TABS ===== */
function renderTabs() {
  tabs.innerHTML = "";
  slides.forEach((_, i) => {
    const tab = document.createElement("div");
    tab.className = "tab " + (i === current ? "active" : "");
    tab.innerText = "Slide " + (i + 1);
    tab.onclick = () => switchSlide(i);
    tabs.appendChild(tab);
  });
}

/* ===== TOGGLE VIEW (Mobile) ===== */
let showEditor = true;

function toggleView() {
  if (window.innerWidth > 900) return;

  showEditor = !showEditor;

  editor.classList.toggle("hide", !showEditor);
  preview.classList.toggle("hide", showEditor);
}

/* ===== EXPORT PDF ===== */
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < slides.length; i++) {

    let iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    document.body.appendChild(iframe);

    iframe.srcdoc = slides[i];

    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(iframe.contentDocument.body);

    const img = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage();

    pdf.addImage(img, "PNG", 0, 0, 210, 297);

    document.body.removeChild(iframe);
  }

  pdf.save("slides.pdf");
}

/* ===== START ===== */
init();
