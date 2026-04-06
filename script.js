let slides = [`<div style="width:1280px;height:720px;background:#111;color:white;display:flex;align-items:center;justify-content:center;"><h1>Hello</h1></div>`];

let current = 0;
let mode = "preview"; // preview | editor

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");
const container = document.querySelector(".container");

/* INIT */
function init() {
  updateMode();
  renderTabs();
  loadSlide();
}

/* MODE SWITCH */
function toggleMode() {
  mode = (mode === "preview") ? "editor" : "preview";
  updateMode();
}

function updateMode() {
  container.classList.remove("show-editor", "show-preview");
  container.classList.add(mode === "editor" ? "show-editor" : "show-preview");
}

/* LOAD */
function loadSlide() {
  editor.value = slides[current];
  renderPreview();
}

/* PREVIEW REAL */
function renderPreview() {
  preview.srcdoc = slides[current];
}

/* EDIT */
editor.addEventListener("input", () => {
  slides[current] = editor.value;
  renderPreview();
});

/* SLIDES */
function addSlide() {
  slides.push("<div style='width:1280px;height:720px;background:black;color:white;'>New</div>");
  current = slides.length - 1;
  renderTabs();
  loadSlide();
}

function switchSlide(i) {
  current = i;
  renderTabs();
  loadSlide();
}

function renderTabs() {
  tabs.innerHTML = "";
  slides.forEach((_, i) => {
    let t = document.createElement("div");
    t.className = "tab " + (i === current ? "active" : "");
    t.innerText = "Slide " + (i+1);
    t.onclick = () => switchSlide(i);
    tabs.appendChild(t);
  });
}

/* 🔥 EXPORT PDF FIX */
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280, 720] // match slide
  });

  for (let i = 0; i < slides.length; i++) {

    let iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    document.body.appendChild(iframe);

    iframe.srcdoc = slides[i];

    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(iframe.contentDocument.body, {
      width: 1280,
      height: 720,
      scale: 2
    });

    const img = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage();

    pdf.addImage(img, "PNG", 0, 0, 1280, 720);

    document.body.removeChild(iframe);
  }

  pdf.save("slides.pdf");
}

init();
