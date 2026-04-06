let slides = [
`<html>
<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:40px;">
Slide 1
</body>
</html>`
];

let current = 0;
let mobileView = false;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const tabs = document.getElementById("tabs");

/* 🔷 Render */
function render() {
  preview.srcdoc = slides[current];
}

/* 🔷 Tabs */
function renderTabs() {
  tabs.innerHTML = "";

  slides.forEach((_, i) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (i === current ? " active" : "");
    tab.innerText = "Slide " + (i + 1);

    tab.onclick = () => {
      save();
      current = i;
      editor.value = slides[current];
      render();
      renderTabs();
    };

    tabs.appendChild(tab);
  });
}

/* 🔷 Save */
function save() {
  slides[current] = editor.value;
}

/* 🔷 Editor typing */
editor.addEventListener("input", () => {
  save();
  render();
});

/* 🔷 Add Slide */
function addSlide() {
  save();
  slides.push("<html><body>New Slide</body></html>");
  current = slides.length - 1;
  editor.value = slides[current];
  renderTabs();
  render();
}

/* 🔷 Toggle Mobile */
function toggleView() {
  mobileView = !mobileView;
  document.body.classList.toggle("mobile", mobileView);
}

/* 🔷 Export PDF (แก้หน้าขาว) */
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < slides.length; i++) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.srcdoc = slides[i];
    document.body.appendChild(iframe);

    await new Promise(r => setTimeout(r, 500));

    const canvas = await html2canvas(iframe.contentDocument.body, {
      useCORS: true,
      scale: 2
    });

    const img = canvas.toDataURL("image/png");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    if (i > 0) pdf.addPage();
    pdf.addImage(img, "PNG", 0, 0, width, height);

    document.body.removeChild(iframe);
  }

  pdf.save("slides.pdf");
}

/* 🔷 Init */
editor.value = slides[current];
render();
renderTabs();
