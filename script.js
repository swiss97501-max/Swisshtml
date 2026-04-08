document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const { jsPDF } = window.jspdf;

    btn.innerText = "...";
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";

    try {
        const pdf = new jsPDF('l', 'px', [1280, 720]);
        const renderContainer = document.createElement('div');
        
        // ตั้งค่า Container ลับให้มีพื้นหลังสีเดียวกับสไลด์เลย
        renderContainer.style.position = 'fixed';
        renderContainer.style.top = '-9999px';
        renderContainer.style.width = '1280px';
        renderContainer.style.background = "#0f172a"; // สีพื้นหลังหลัก
        document.body.appendChild(renderContainer);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const div = document.createElement('div');
            div.style.width = '1280px';
            div.style.height = '720px';
            div.style.overflow = 'hidden';
            div.innerHTML = slide.content;
            renderContainer.appendChild(div);

            // 🏆 เคล็ดลับ 1: รอให้ Font และ Tailwind โหลดเสร็จจริง ๆ
            await document.fonts.ready; 
            await new Promise(r => setTimeout(r, 500)); // ให้เวลา Render อีกนิด

            // 🏆 เคล็ดลับ 2: บังคับ backgroundColor ใน html2canvas
            const canvas = await html2canvas(div, {
                width: 1280,
                height: 720,
                scale: 2,
                useCORS: true,
                backgroundColor: "#0f172a", // บังคับให้พื้นหลังเป็นสีนี้ถ้ามันหาไม่เจอ
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage([1280, 720], 'l');
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            renderContainer.removeChild(div);
        }

        pdf.save(`presentation-${Date.now()}.pdf`);
    } catch (err) {
        console.error(err);
        alert("Export failed: " + err.message);
    } finally {
        document.body.removeChild(renderContainer);
        btn.innerText = "↓";
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
    }
};
