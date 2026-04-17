// ============================================
// 🎯 SLIDE ENGINE - WORKING VERSION v2.0
// ============================================

// Sample slide with chemical formulas
let slides = [{ 
    id: Date.now(), 
    content: `<div style="width:100%;height:100%;background:#1e3a8a;color:white;padding:48px;font-family:'Sarabun',sans-serif;">
    <div style="margin-bottom:24px;">
        <p style="color:#fbbf24;font-size:20px;margin-bottom:8px;">▶ ฟัง (Trap): เป็นการรับอิเล็กตรอนเข้ามา</p>
        <p style="color:white;font-size:18px;margin-left:24px;margin-bottom:16px;">
            ตัวอย่าง: <span style="color:#fbbf24;font-weight:600;">Cr<sub style="font-size:0.7em;">2</sub>O<sub style="font-size:0.7em;">7</sub><sup style="font-size:0.7em;">2-</sup></span>
        </p>
        <p style="color:white;font-size:18px;margin-left:24px;line-height:1.8;">
            โดยรับ: 1 อิเล็กตรอน → K<sub style="font-size:0.7em;">2</sub>Cr<sub style="font-size:0.7em;">2</sub>O<sub style="font-size:0.7em;">7</sub><br>
            รับ K<sup style="font-size:0.7em;">+</sup> 2 อิเล็กตรอน → Cr<sub style="font-size:0.7em;">2</sub>O<sub style="font-size:0.7em;">7</sub><sup style="font-size:0.7em;">2-</sup> เหลือ 1 อิเล็กตรอน
        </p>
    </div>
    <div style="margin-top:32px;padding:16px;background:rgba(127,29,29,0.3);border-left:4px solid #ef4444;border-radius:4px;">
        <p style="color:#fbbf24;font-size:18px;">⚠️ หมายเหตุ ไอออน Cr<sub style="font-size:0.7em;">2</sub>O<sub style="font-size:0.7em;">7</sub><sup style="font-size:0.7em;">2-</sup> สำคัญมากในเคมี</p>
    </div>
</div>` 
}];

let activeSlideId = slides[0].id;
const editor = document.getElementById('html-editor');
const previewContent = document.getElementById('preview-content');
const wrapper = document.getElementById('canvas-wrapper');
const previewArea = document.querySelector('.scale-anchor');

// ============================================
// 🎨 PREVIEW SYSTEM (DIV-BASED)
// ============================================
function updatePreview() {
    const slide = slides.find(s => s.id === activeSlideId);
    if (slide) {
        slide.content = editor.value;
    }
    
    const content = editor.value || slides.find(s => s.id === activeSlideId)?.content || '';
    
    // Render directly into div (NOT iframe)
    previewContent.innerHTML = content;
    
    // Apply base styles to wrapper
    wrapper.style.background = '#1e3a8a';
}

// ============================================
// 📄 PDF EXPORT SYSTEM (WORKING!)
// ============================================
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    // Update button state
    btn.innerText = "⏳";
    btn.style.opacity = "0.6";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            // Create temporary container for rendering
            const tempContainer = document.createElement('div');
            tempContainer.id = 'temp-export-container';
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                width: 1280px;
                height: 720px;
                background: #1e3a8a;
                overflow: hidden;
                z-index: -99999;
            `;
            
            // Add the slide content
            tempContainer.innerHTML = slide.content;
            document.body.appendChild(tempContainer);

            // Wait for DOM to settle
            await new Promise(r => setTimeout(r, 100));

            // Use html2canvas with proper settings
            const canvas = await html2canvas(tempContainer, {
                width: 1280,
                height: 720,
                scale: 2, // High quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#1e3a8a',
                logging: false,
                removeContainer: false,
                foreignObjectRendering: false, // Better compatibility
                imageTimeout: 0, // Don't wait for images
                onclone: function(clonedDoc, element) {
                    // Fix fonts in clone
                    element.style.fontFamily = "'Sarabun', sans-serif";
                    
                    // Ensure all sub/sup are visible
                    const subs = element.querySelectorAll('sub');
                    const sups = element.querySelectorAll('sup');
                    
                    subs.forEach(el => {
                        el.style.fontSize = '0.7em';
                        el.style.verticalAlign = 'baseline';
                        el.style.position = 'relative';
                        el.style.bottom = '-0.25em';
                    });
                    
                    sups.forEach(el => {
                        el.style.fontSize = '0.7em';
                        el.style.verticalAlign = 'baseline';
                        el.style.position = 'relative';
                        el.style.top = '-0.5em';
                    });
                }
            });

            // Convert to image and add to PDF
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            if (i > 0) {
                pdf.addPage([1280, 720], 'l');
            }
            
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            // Clean up
            document.body.removeChild(tempContainer);
        }

        // Save PDF
        const timestamp = new Date().toISOString().slice(0,19).replace(/[:-]/g,'');
        pdf.save(`slides_${timestamp}.pdf`);
        
        // Show success message
        alert('✅ Export PDF สำเร็จ!');
        
    } catch (err) {
        console.error('Export Error:', err);
        alert('❌ Export ล้มเหลว: ' + err.message);
    } finally {
        // Reset button
        btn.innerText = "↓";
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
};

// ============================================
// ➕ ADD NEW SLIDE
// ============================================
document.getElementById('btn-add').onclick = () => {
    const newSlide = { 
        id: Date.now(), 
        content: `<div style="width:100%;height:100%;background:#1e3a8a;color:white;padding:48px;font-family:'Sarabun',sans-serif;display:flex;align-items:center;justify-content:center;">
    <div style="text-align:center;">
        <h1 style="font-size:48px;font-weight:bold;margin-bottom:16px;">🎉 สไลด์ใหม่</h1>
        <p style="font-size:20px;opacity:0.8;">พิมพ์ HTML/Tailwind ที่ Editor ทางซ้าย</p>
    </div>
</div>` 
    };
    
    slides.push(newSlide);
    activeSlideId = newSlide.id;
    editor.value = newSlide.content;
    renderTabs();
    updatePreview();
};

// ============================================
// 📑 TABS SYSTEM
// ============================================
function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    
    slides.forEach((s, i) => {
        const tab = document.createElement('div');
        tab.className = `tab ${s.id === activeSlideId ? 'active' : ''}`;
        tab.innerText = i + 1;
        tab.title = `สไลด์ ${i + 1}`;
        
        tab.onclick = () => {
            // Save current slide before switch
            const currentSlide = slides.find(sl => sl.id === activeSlideId);
            if (currentSlide) {
                currentSlide.content = editor.value;
            }
            
            // Switch to new slide
            activeSlideId = s.id;
            editor.value = s.content;
            renderTabs();
            updatePreview();
        };
        
        container.appendChild(tab);
    });
}

// ============================================
// 📐 SCALE & RESPONSIVE
// ============================================
function fitSlide() {
    if (!previewArea || !wrapper || previewArea.clientWidth === 0) return;
    
    const maxWidth = previewArea.clientWidth - 40;
    const maxHeight = previewArea.clientHeight - 40;
    const scale = Math.min(maxWidth / 1280, maxHeight / 720, 1);
    
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// Observe resize
const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(fitSlide);
});

if (previewArea) {
    resizeObserver.observe(previewArea);
}

// Update preview on input (with debounce)
let debounceTimer;
editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);
});

// Mobile swap button
document.getElementById('btn-swap').onclick = () => { 
    document.querySelector('.app').classList.toggle('swap'); 
    setTimeout(fitSlide, 100); 
};

// ============================================
// 🚀 INITIALIZATION
// ============================================
function init() {
    // Set initial content
    editor.value = slides[0].content;
    
    // Render tabs
    renderTabs();
    
    // Show first preview
    updatePreview();
    
    // Fit slide after a short delay
    setTimeout(fitSlide, 100);
    
    console.log('✅ Slide Engine Ready!');
    console.log('📝 Tips: ใช้ <sub> และ <sup> สำหรับสูตรเคมี');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Also init on window load (for fonts)
window.addEventListener('load', () => {
    setTimeout(fitSlide, 200);
    updatePreview();
});
