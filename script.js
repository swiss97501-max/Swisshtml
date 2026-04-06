/* STATE */
let slides = [
`<div class="w-[1280px] h-[720px] bg-[#0f172a] text-white flex items-center justify-center">
<h1 class="text-5xl font-bold">Slide 1</h1>
</div>`
];

let current = 0;

/* ELEMENTS */
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
  preview.srcdoc = `
  <html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun&family=Playfair+Display&display=swap" rel="stylesheet">
  </head>
  <body>${slides[current]}</body>
  </html>
  `;
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
  slides.push(`<div class="w-[1280px] h-[720px] bg-black text-white flex items-center justify-center">New Slide</div>`);
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

/* EDITOR */
function toggleEditor(){
  panel.classList.toggle("open");
}

/* WAIT RENDER */
function wait(){
  return new Promise(r=>{
    requestAnimationFrame(()=>{
      requestAnimationFrame(r);
    });
  });
}

/* 🔥 EXPORT PDF (fixed จริง) */
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
    await document.fonts.ready;

    const canvas = await html2canvas(el,{
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

/* START */
init();
