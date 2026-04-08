// 🏆 ระบบดาวน์โหลด PDF ตรงแบบไม่พัง (Direct Download Fix) 🏆
document.getElementById('btn-export').onclick = async () => {
    const loading = document.getElementById('loading-overlay');
    loading.style.display = 'flex'; // แสดงหน้าจอโหลด

    try {
        const { jsPDF } = window.jspdf;
        // สร้างเอกสาร PDF แนวนอน (Landscape) ขนาด 1280x720 pixels
        const pdf = new jsPDF('l', 'px', [1280, 720]);

        // สร้าง Iframe ล่องหนเพื่อใช้ Render ภาพทีละสไลด์
        const exportFrame = document.createElement('iframe');
        exportFrame.style.position = 'absolute';
        exportFrame.style.width = '1280px';
        exportFrame.style.height = '720px';
        exportFrame.style.top = '-9999px'; // ซ่อนไว้นอกจอ
        document.body.appendChild(exportFrame);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            // เตรียมเนื้อหาของสไลด์แต่ละหน้า
            const docContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { 
                            margin: 0; padding: 0; width: 1280px; height: 720px; 
                            overflow: hidden; background-color: white; 
                            font-family: sans-serif;
                            -webkit-print-color-adjust: exact; 
                        }
                    </style>
                </head>
                <body>
                    <div id="slide-capture-area" style="width: 1280px; height: 720px;">
                        ${slide.content}
                    </div>
                </body>
                </html>
            `;

            // ยัดโค้ดใส่ Iframe ล่องหน
            exportFrame.contentDocument.open();
            exportFrame.contentDocument.write(docContent);
            exportFrame.contentDocument.close();

            // ⚠️ จุดสำคัญที่สุด: รอ 1.5 วินาทีเพื่อให้ Tailwind โหลดคลาสสีและวาดกราฟิกให้เสร็จ
            await new Promise(resolve => setTimeout(resolve, 1500));

            // ถ่ายรูปด้วย html2canvas
            const targetElement = exportFrame.contentDocument.getElementById('slide-capture-area');
            const canvas = await html2canvas(targetElement, {
                scale: 2, // สเกล 2 เท่าเพื่อให้ตัวหนังสือใน PDF คมชัด ไม่แตก
                useCORS: true, // อนุญาตให้โหลดรูปจากเว็บอื่นได้
                backgroundColor: '#ffffff', // บังคับพื้นหลังสีขาวกันโปร่งใส
                logging: false
            });

            // แปลงเป็นภาพ JPEG คุณภาพสูง
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // ถ้าไม่ใช่สไลด์หน้าแรก ให้เพิ่มหน้ากระดาษใหม่ใน PDF
            if (i > 0) pdf.addPage();
            
            // แปะภาพลง PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }

        // ลบ Iframe ล่องหนทิ้งเมื่อเสร็จสิ้น
        document.body.removeChild(exportFrame);

        // สั่งดาวน์โหลดลงเครื่องทันที!
        pdf.save('Slide_Presentation.pdf');

    } catch (error) {
        console.error("PDF Export Error: ", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF ลองตรวจสอบดูว่ามีรูปภาพที่ติดลิขสิทธิ์ (CORS) หรือไม่");
    } finally {
        loading.style.display = 'none'; // ปิดหน้าจอโหลด
    }
};
