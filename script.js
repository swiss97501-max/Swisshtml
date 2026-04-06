let slides = [
`<div style="
width:1280px;
height:720px;
background:#0f172a;
color:white;
display:flex;
align-items:center;
justify-content:center;
font-size:40px;
">
Slide 1
</div>`
];

let current = 0;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");
const panel = document.getElementById("editorPanel");
const renderRoot = document.getElementById("renderRoot");

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
  slides.push(`<div style="width:1280px;height:720px;background:black;color:white;display:flex;align-items:center;justify-content:center;">New Slide</div>`);
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

/* editor toggle */
function toggleEditor(){
  panel.classList.toggle("open");
}

/* wait render */
function wait(){
  return new Promise(r=>{
    requestAnimationFrame(()=>{
      requestAnimationFrame(r);
    });
  });
}

/* EXPORT PDF (no bug) */
async function exportPDF(){

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280,720]
  });

  for(let i=0;i<slides.length;i++){

    renderRoot.innerHTML = slides[i];

    let el = renderRoot.firstElementChild;

    el.style.width = "1280px";
    el.style.height = "720px";

    await wait();

    const canvas = await html2canvas(el,{
      width:1280,
      height:720,
      scale:2
    });

    const img = canvas.toDataURL("image/png");

    if(i>0) pdf.addPage();

    pdf.addImage(img,"PNG",0,0,1280,720);
  }

  pdf.save("slides.pdf");
}

init();
