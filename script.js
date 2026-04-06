document.addEventListener("DOMContentLoaded", () => {

  let pages = [
    { id: Date.now(), html: "<h1 style='color:white'>Page 1</h1>" }
  ];

  let currentPageIndex = 0;

  const tabs = document.getElementById("pageTabs");
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");

  const addBtn = document.getElementById("addPageBtn");
  const exportBtn = document.getElementById("exportBtn");

  const editorPane = document.getElementById("editorPane");
  const previewPane = document.getElementById("previewPane");

  const showEditorBtn = document.getElementById("showEditorBtn");
  const showPreviewBtn = document.getElementById("showPreviewBtn");

  // =========================================================
  // RESPONSIVE
  // =========================================================
  function isMobile() {
    return window.innerWidth <= 1024;
  }

  function applyMode() {
    if (isMobile()) {
      editorPane.style.display = "flex";
      previewPane.style.display = "none";
    } else {
      editorPane.style.display = "flex";
      previewPane.style.display = "flex";
    }
  }

  window.addEventListener("resize", applyMode);

  // =========================================================
  // TABS
  // =========================================================
  function renderTabs() {
    tabs.innerHTML = "";

    pages.forEach((p, i) => {
      const tab = document.createElement("div");
      tab.className = "page-tab" + (i === currentPageIndex ? " active" : "");
      tab.textContent = "Page " + (i + 1);

      tab.onclick = () => {
        currentPageIndex = i;
        loadPage();
        renderTabs();
      };

      tabs.appendChild(tab);
    });
  }

  // =========================================================
  // LOAD
  // =========================================================
  function loadPage() {
    editor.value = pages[currentPageIndex].html;
    updatePreview();
  }

  function updatePreview() {
    preview.innerHTML = pages[currentPageIndex].html;
  }

  // =========================================================
  // EVENTS
  // =========================================================
  editor.addEventListener("input", () => {
    pages[currentPageIndex].html = editor.value;
    updatePreview();
  });

  addBtn.onclick = () => {
    pages.push({
      id: Date.now(),
      html: "<h1 style='color:white'>New Page</h1>"
    });

    currentPageIndex = pages.length - 1;
    renderTabs();
    loadPage();
  };

  // =========================================================
  // TOGGLE
  // =========================================================
  showEditorBtn.onclick = () => {
    if (!isMobile()) return;
    editorPane.style.display = "flex";
    previewPane.style.display = "none";
  };

  showPreviewBtn.onclick = () => {
    if (!isMobile()) return;
    editorPane.style.display = "none";
    previewPane.style.display = "flex";
  };

  // =========================================================
  // EXPORT PDF
  // =========================================================
  exportBtn.onclick = async () => {

    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1280, 720]
    });

    for (let i = 0; i < pages.length; i++) {

      const wrapper = document.createElement("div");
      wrapper.style.width = "1280px";
      wrapper.style.height = "720px";
      wrapper.style.position = "fixed";
      wrapper.style.top = "-9999px";
      wrapper.innerHTML = pages[i].html;

      document.body.appendChild(wrapper);

      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(wrapper);
      const img = canvas.toDataURL("image/jpeg", 1);

      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 1280, 720);

      document.body.removeChild(wrapper);
    }

    pdf.save("slides.pdf");
  };

  function loadScript(src) {
    return new Promise(res => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      document.body.appendChild(s);
    });
  }

  // INIT
  renderTabs();
  loadPage();
  applyMode();

});
