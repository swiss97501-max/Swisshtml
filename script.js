document.addEventListener("DOMContentLoaded", () => {

  let pages = [
    {
      id: Date.now(),
      html: `<!DOCTYPE html>
<html>
<body style="background:#0f172a;color:white;display:flex;justify-content:center;align-items:center;height:100vh;">
<h1>Slide 1</h1>
</body>
</html>`
    }
  ];

  let currentPageIndex = 0;

  const tabs = document.getElementById("pageTabs");
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");

  const addBtn = document.getElementById("addPageBtn");

  const editorPane = document.getElementById("editorPane");
  const previewPane = document.getElementById("previewPane");

  const showEditorBtn = document.getElementById("showEditorBtn");
  const showPreviewBtn = document.getElementById("showPreviewBtn");

  // =========================================================
  // DEVICE DETECT
  // =========================================================
  function isTablet() {
    return window.innerWidth <= 1024 && window.innerWidth > 600;
  }

  function isMobile() {
    return window.innerWidth <= 600;
  }

  function applyMode() {
    if (isMobile() || isTablet()) {
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
  // LOAD PAGE
  // =========================================================
  function loadPage() {
    editor.value = pages[currentPageIndex].html;
    updatePreview();
  }

  function updatePreview() {
    preview.innerHTML = `<iframe id="frame"></iframe>`;

    const iframe = document.getElementById("frame");
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    doc.open();
    doc.write(pages[currentPageIndex].html);
    doc.close();
  }

  // =========================================================
  // EDIT
  // =========================================================
  editor.addEventListener("input", () => {
    pages[currentPageIndex].html = editor.value;
    updatePreview();
  });

  // =========================================================
  // ADD PAGE
  // =========================================================
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
    if (!isMobile() && !isTablet()) return;
    editorPane.style.display = "flex";
    previewPane.style.display = "none";
  };

  showPreviewBtn.onclick = () => {
    if (!isMobile() && !isTablet()) return;
    editorPane.style.display = "none";
    previewPane.style.display = "flex";
  };

  // INIT
  renderTabs();
  loadPage();
  applyMode();

});
