let slides = [
`<div style="width:1280px;height:720px;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;">
<h1>Slide 1</h1>
</div>`
];

let current = 0;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");
const panel = document.getElementById("editorPanel");

/* INIT */
function init(){
  renderTabs();
  loadSlide();
}

/* PREVIEW */
function renderPreview(){
  preview.srcdoc = slides[current];
}

/* LOAD */
function loadSlide(){
  editor.value = slides[current];
  renderPreview();
}

/* EDIT */
editor.addEventListener("input", ()=>{
  slides[current] = editor.value;
  renderPreview();
});

/* SLIDES */
function addSlide(){
  slides.push(`<div style="width:1280px;height:720px;background:black;color:white;">New</div>`);
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
    t.className = "tab " + (i===current?"active":"");
    t.innerText = "Slide " + (i+1);
    t.onclick = ()=>switchSlide(i);
    tabs.appendChild(t);
  });
}

/* EDITOR PANEL */
function toggleEditor(){
  panel.classList.toggle("open");
}

/* 🔥 EXPORT PDF (แก้จริง) */
async function exportPDF(){

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280,720]
  });

  const root = document.getElementById("renderRoot");

  for(let i=0;i<slides.length;i++){

    root.innerHTML = slides[i];

    // force size
    root.firstElementChild.style.width = "1280px";
    root.firstElementChild.style.height = "720px";

    await new Promise(r=>setTimeout(r,200));

    const canvas = await html2canvas(root.firstElementChild,{
      width:1280,
      height:720,
      scale:2,
      useCORS:true
    });

    const img = canvas.toDataURL("image/png");

    if(i>0) pdf.addPage();

    pdf.addImage(img,"PNG",0,0,1280,720);
  }

  pdf.save("slides.pdf");
}

init();
