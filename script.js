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
   PREVIEW (REAL RENDER)
========================= */
function renderPreview(){
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
   SLIDES
========================= */
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

/* =========================
   EDITOR PANEL
========================= */
function toggleEditor(){
  panel.classList.toggle("open");
}

/* =========================
   🔥 PREPARE RENDER (แก้ CDN / font)
========================= */
async function prepareRender(html){

  // inject HTML
  renderRoot.innerHTML = html;

  // 🔥 clone <head> resources (link + style)
  const temp = document.createElement("div");
  temp.innerHTML = html;

  const links = temp.querySelectorAll("link");
  const styles = temp.querySelectorAll("style");

  const promises = [];

  // โหลด external CSS (Google Fonts ฯลฯ)
  links.forEach(link=>{
    if(link.href){
      const newLink = document.createElement("link");
      newLink.rel = "stylesheet";
      newLink.href = link.href;

      document.head.appendChild(newLink);

      promises.push(new Promise(res=>{
        newLink.onload = res;
        setTimeout(res, 1200); // fallback
      }));
    }
  });

  // inject inline style
  styles.forEach(style=>{
    const newStyle = document.createElement("style");
    newStyle.innerHTML = style.innerHTML;
    document.head.appendChild(newStyle);
  });

  // 🔥 รอ font โหลด
  if(document.fonts){
    promises.push(document.fonts.ready);
  }

  await Promise.all(promises);

  return renderRoot.firstElementChild;
}

/* =========================
   WAIT RENDER
========================= */
function waitForRender(){
  return new Promise(res=>{
    requestAnimationFrame(()=>{
      requestAnimationFrame(res);
    });
  });
}

/* =========================
   🔥 EXPORT PDF (FIX จริง)
========================= */
async function exportPDF(){

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280,720]
  });

  for(let i=0;i<slides.length;i++){

    let el = await prepareRender(slides[i]);

    // 🔥 lock size
    el.style.width = "1280px";
    el.style.height = "720px";
    el.style.margin = "0";
    el.style.padding = "0";

    await waitForRender();
    await new Promise(r=>setTimeout(r,200));

    const canvas = await html2canvas(el,{
      width:1280,
      height:720,
      scale:2,
      useCORS:true,
      backgroundColor:"#ffffff"
    });

    const img = canvas.toDataURL("image/png");

    if(i>0) pdf.addPage();

    pdf.addImage(img,"PNG",0,0,1280,720);
  }

  pdf.save("slides.pdf");
}

/* =========================
   AUTO SAVE
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
