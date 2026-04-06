/* =========================
   STATE
========================= */
let slides = [
`<div style="width:1280px;height:720px;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;">
<h1>Slide 1</h1>
</div>`
];

let current = 0;

/* =========================
   ELEMENTS
========================= */
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");
const panel = document.getElementById("editorPanel");
const renderRoot = document.getElementById("renderRoot");

/* =========================
   INIT
========================= */
function init(){
  renderTabs();
  loadSlide();
}

/* =========================
   PREVIEW ENGINE
========================= */
function renderPreview(){
  // ใช้ iframe render จริง
  preview.srcdoc = slides[current];
}

/* =========================
   LOAD / EDIT
========================= */
function loadSlide(){
  editor.value = slides[current];
  renderPreview();
}

editor.addEventListener("input", ()=>{
  slides[current] = editor.value;
  renderPreview();
});

/* =========================
   SLIDE MANAGEMENT
========================= */
function addSlide(){
  slides.push(`<div style="width:1280px;height:720px;background:#020617;color:white;display:flex;align-items:center;justify-content:center;">New Slide</div>`);
  current = slides.length - 1;
  renderTabs();
  loadSlide();
}

function switchSlide(i){
  current = i;
  renderTabs();
  loadSlide();
}

function renderTabs(){
  tabs.innerHTML = "";

  slides.forEach((_,i)=>{
    let t = document.createElement("div");
    t.className = "tab " + (i===current ? "active" : "");
    t.innerText = "Slide " + (i+1);

    t.onclick = ()=>switchSlide(i);

    tabs.appendChild(t);
  });
}

/* =========================
   EDITOR PANEL CONTROL
========================= */
function toggleEditor(){
  panel.classList.toggle("open");
}

/* =========================
   PDF EXPORT ENGINE (FIX จริง)
========================= */
async function exportPDF(){

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280,720]
  });

  for(let i=0;i<slides.length;i++){

    // inject HTML ลง DOM จริง (ไม่ใช้ iframe แล้ว)
    renderRoot.innerHTML = slides[i];

    let el = renderRoot.firstElementChild;

    // 🔥 บังคับขนาดแน่นอน
    el.style.width = "1280px";
    el.style.height = "720px";
    el.style.margin = "0";
    el.style.padding = "0";

    // 🔥 รอ render เสถียร (สำคัญมาก)
    await waitForRender(el);

    const canvas = await html2canvas(el,{
      width:1280,
      height:720,
      scale:2,
      useCORS:true,
      backgroundColor:null
    });

    const img = canvas.toDataURL("image/png");

    if(i>0) pdf.addPage();

    pdf.addImage(img,"PNG",0,0,1280,720);
  }

  pdf.save("slides.pdf");
}

/* =========================
   WAIT RENDER (สำคัญมาก)
========================= */
function waitForRender(el){
  return new Promise(resolve=>{
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        resolve();
      });
    });
  });
}

/* =========================
   OPTIONAL: AUTO SAVE
========================= */
function save(){
  localStorage.setItem("slides", JSON.stringify(slides));
}

function load(){
  const data = localStorage.getItem("slides");
  if(data) slides = JSON.parse(data);
}

setInterval(save, 2000);

/* =========================
   START
========================= */
load();
init();
