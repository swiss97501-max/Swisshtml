document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // STATE
  // ============================================================
  let pages = [
    { id: Date.now(), html: "<h1 style='color:white'>Page 1</h1>" }
  ];

  let currentPageIndex = 0;
  let libsLoaded = false;

  // ============================================================
  // DOM
  // ============================================================
  const tabsContainer = document.getElementById("pageTabs");
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const addBtn = document.getElementById("addPageBtn");
  const exportBtn = document.getElementById("exportBtn");

  const editorPane = document.getElementById("editorPane");
  const previewPane = document.getElementById("previewPane");
  const showEditorBtn = document.getElementById("showEditorBtn");
  const showPreviewBtn = document.getElementById("showPreviewBtn");

  // ============================================================
  // INIT
  // ============================================================
  renderTabs();
  loadPage();
  applyResponsiveMode();

  // ============================================================
  // RESPONSIVE (iPad FIX)
  // ============================================================
  function isTabletOrMobile() {
    return window.innerWidth <= 1024;
  }

  function applyResponsiveMode() {
    if (isTabletOrMobile()) {
      editorPane.style.display = "flex";
      previewPane.style.display = "none";
    } else {
      editorPane.style.display = "flex";
      previewPane.style.display = "flex";
    }
  }

  window.addEventListener("resize", applyResponsiveMode);

  // ============================================================
  // RENDER TABS
  // ============================================================
  function renderTabs() {
    tabsContainer.innerHTML = "";

    pages.forEach((page, index) => {
      const tab = document.createElement("div");
      tab.className = "page-tab" + (index === currentPageIndex ? " active" : "");

      const title = document.createElement("span");
      title.textContent = "Page " + (index + 1);

      const del = document.createElement("button");
      del.textContent = "×";

      del.onclick = (e) => {
        e.stopPropagation();
        deletePage(index);
      };

      tab.onclick = () => {
        currentPageIndex = index;
        loadPage();
        renderTabs();
      };

      tab.appendChild(title);
      tab.appendChild(del);
      tabsContainer.appendChild(tab);
    });
  }

  // ============================================================
  // LOAD PAGE
  // ============================================================
  function loadPage() {
    editor.value = pages[currentPageIndex].html;
    updatePreview();
  }

  // ============================================================
  // UPDATE PREVIEW
  // ============================================================
  function updatePreview() {
    preview.innerHTML = pages[currentPageIndex].html;
  }

  // ============================================================
  // DELETE PAGE
  // ============================================================
  function deletePage(index) {
    if (pages.length === 1) return;

    pages.splice(index, 1);

    if (currentPageIndex >= pages.length) {
      currentPageIndex = pages.length - 1;
    }

    renderTabs();
    loadPage();
  }

  // ============================================================
  // EVENTS
  // ============================================================
  editor.addEventListener("input", () => {
    pages[currentPageIndex].html = editor.value;
    updatePreview();
  });

  addBtn.addEventListener("click", () => {
    pages.push({
      id: Date.now(),
      html: "<h1 style='color:white'>New Page</h1>"
    });

    currentPageIndex = pages.length - 1;
    renderTabs();
    loadPage();
  });

  // ============================================================
  // TOGGLE (iPad / Mobile)
  // ============================================================
  if (showEditorBtn && showPreviewBtn) {
    showEditorBtn.onclick = () => {
      if (!isTabletOrMobile()) return;
      editorPane.style.display = "flex";
      previewPane.style.display = "none";
    };

    showPreviewBtn.onclick = () => {
      if (!isTabletOrMobile()) return;
      editorPane.style.display = "none";
      previewPane.style.display = "flex";
    };
  }

  // ============================================================
  // LOAD SCRIPT (ONCE)
  // ============================================================
  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.body.appendChild(s);
    });
  }

  // ============================================================
  // EXPORT PDF
  // ============================================================
  exportBtn.addEventListener("click", async () => {

    if (!libsLoaded) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      libsLoaded = true;
    }

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
      wrapper.style.left = "0";
      wrapper.style.background = "#0f172a";
      wrapper.style.overflow = "hidden";

      wrapper.innerHTML = pages[i].html;
      document.body.appendChild(wrapper);

      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        backgroundColor: "#0f172a"
      });

      const img = canvas.toDataURL("image/jpeg", 1.0);

      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 1280, 720);

      document.body.removeChild(wrapper);
    }

    pdf.save("slides.pdf");
  });

});
