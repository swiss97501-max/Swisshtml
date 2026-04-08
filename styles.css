:root {
    --bg: #050505;
    --sidebar: #0f0f0f;
    --editor: #121212;
    --accent: #4f46e5;
    --green: #4ade80;
    --border: #222;
}

* { box-sizing: border-box; }
body, html { margin: 0; height: 100vh; font-family: 'Inter', sans-serif; background: var(--bg); color: white; overflow: hidden; }

.app { display: flex; height: 100vh; width: 100vw; }

/* Sidebar */
.sidebar { width: 70px; background: var(--sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; padding: 15px 0; z-index: 100; }
.brand { font-size: 11px; font-weight: bold; margin-bottom: 20px; color: var(--accent); letter-spacing: 1px; }
.btn-icon { width: 45px; height: 45px; border-radius: 12px; border: 1px solid var(--border); background: #1a1a1a; color: white; cursor: pointer; font-size: 20px; margin-bottom: 10px; transition: 0.2s; }
.btn-icon:hover { background: var(--accent); border-color: var(--accent); }
.btn-icon.danger:hover { background: #ef4444; border-color: #ef4444; }

.tabs-vertical { flex: 1; width: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 10px; }
.tab { width: 40px; height: 40px; background: #1a1a1a; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; transition: 0.2s; color: #888; }
.tab.active { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 0 15px rgba(79, 70, 229, 0.3); }

/* Editor Content */
.editor-container { flex: 1; display: flex; flex-direction: column; background: var(--editor); border-right: 1px solid var(--border); position: relative; }
.pane-header { font-size: 10px; padding: 15px 20px; color: #555; font-weight: bold; letter-spacing: 1px; background: rgba(0,0,0,0.1); }
#html-editor { flex: 1; background: transparent; border: none; padding: 20px; color: var(--green); font-family: 'Fira Code', monospace; font-size: 14px; outline: none; resize: none; line-height: 1.6; }

/* Preview & Scaling Engine */
.preview-container { flex: 1.2; display: flex; flex-direction: column; position: relative; background: #000; overflow: hidden; }
.scale-anchor { flex: 1; position: relative; width: 100%; height: 100%; }

.canvas-wrapper {
    position: absolute;
    top: 50%; left: 50%;
    width: 1280px; height: 720px;
    background: white;
    transform-origin: center center;
    box-shadow: 0 0 50px rgba(0,0,0,0.7);
}
#preview-frame { width: 100%; height: 100%; border: none; background: white; }

/* Mobile UI */
.mobile-only-btn { display: none; position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; background: var(--accent); border-radius: 30px; border: none; color: white; font-weight: bold; z-index: 1000; }

@media (max-width: 1024px) {
    .app { flex-direction: column; }
    .sidebar { width: 100%; height: 65px; flex-direction: row; padding: 0 15px; }
    .brand { margin-bottom: 0; margin-right: 15px; }
    nav { display: flex; gap: 8px; margin-right: 15px; }
    .btn-icon { margin-bottom: 0; width: 40px; height: 40px; }
    .tabs-vertical { flex-direction: row; margin-top: 0; justify-content: flex-start; }
    .mobile-only-btn { display: block; }
    .app.swap .editor-container { display: none; }
    .app:not(.swap) .preview-container { display: none; }
}

/* Loading Overlay */
#loading-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.95);
    display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;
}
.loader { width: 40px; height: 40px; border: 4px solid #222; border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
#loading-overlay p { color: white; margin-top: 20px; text-align: center; line-height: 1.5; }
#loading-overlay span { font-size: 12px; color: #666; }
@keyframes spin { to { transform: rotate(360deg); } }
