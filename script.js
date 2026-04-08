// ==========================================
// 🆕🆕🆕 EXPORT PDF: DOWNLOAD โดยตรง (FIX BACKGROUND)
// ==========================================
document.getElementById('btn-export').onclick = async () => {
    const btn = document.getElementById('btn-export');
    const originalText = btn.innerHTML;
    
    try {
        // 1. แสดง Loading State
        btn.disabled = true;
        btn.innerHTML = '⏳';
        btn.style.opacity = '0.7';

        // 2. สร้าง container ชั่วคราวสำหรับ render สไลด์ทั้งหมด
        const exportContainer = document.getElementById('pdf-export-container');
        exportContainer.innerHTML = ''; // ล้างข้อมูลเก่า
        
        // 3. 🆕 สร้าง iframe ชั่วคราวเพื่อโหลด Tailwind อย่างเต็มรูปแบบ
        const tempIframe = document.createElement('iframe');
        tempIframe.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 1280px;
            height: 720px;
            border: none;
            visibility: hidden;
        `;
        document.body.appendChild(tempIframe);

        // 4. 🆕 เขียน HTML ลง iframe (รวม Tailwind CDN)
        let slidesHTML = '';
        slides.forEach((slide, index) => {
            slidesHTML += `
                <div class="pdf-slide" style="
                    width: 1280px;
                    height: 720px;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                    page-break-after: always;
                ">
                    ${slide.content}
                </div>
            `;
        });

        const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <!-- 🆕 โหลด Tailwind ใน iframe -->
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    /* บังคับให้พื้นหลังแสดงผล */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    body {
                        background: white;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    
                    .pdf-slide {
                        width: 1280px !important;
                        height: 720px !important;
                        position: relative !important;
                        overflow: hidden !important;
                    }
                </style>
            </head>
            <body>
                ${slidesHTML}
                
                <!-- 🆕 Script แจ้งเตือนว่า Tailwind โหลดเสร็จแล้ว -->
                <script>
                    // รอให้ Tailwind โหลดและ process classes เสร็จ
                    window.addEventListener('load', () => {
                        // รออีกนิดเพื่อให้ Tailwind ทำงานเสร็จ
                        setTimeout(() => {
                            window.tailwindLoaded = true;
                            // ส่ง signal ไปหา parent
                            window.parent.postMessage('TAILWIND_READY', '*');
                        }, 1000);
                    });
                    
                    // Fallback: ถ้า load event ไม่ทำงาน
                    setTimeout(() => {
                        if (!window.tailwindLoaded) {
                            window.tailwindLoaded = true;
                            window.parent.postMessage('TAILWIND_READY', '*');
                        }
                    }, 3000);
                <\/script>
            </body>
            </html>
        `);
        iframeDoc.close();

        // 5. 🆕 รอให้ Tailwind โหลดเสร็จ (ด้วย Promise)
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('Timeout: ใช้ fallback');
                resolve(); // Force resolve ถ้ารอนานเกินไป
            }, 5000); // รอสูงสุด 5 วินาที
            
            const handler = (event) => {
                if (event.data === 'TAILWIND_READY') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    console.log('✅ Tailwind loaded successfully');
                    resolve();
                }
            };
            
            window.addEventListener('message', handler);
        });

        // 6. 🆕 ใช้ html2canvas จับภาพจาก iframe content
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1280, 720]
        });

        // 7. จับภาพแต่ละ slide
        for (let i = 0; i < slides.length; i++) {
            const slideElement = iframeDoc.querySelectorAll('.pdf-slide')[i];
            
            if (!slideElement) continue;

            // 🆕 ใช้ html2canvas พร้อม option ครบถ้วน
            const canvas = await html2canvas(slideElement, {
                scale: 2, // ความละเอียด 2x (Retina)
                useCORS: true, // อนุญาต cross-origin images
                allowTaint: true,
                backgroundColor: null, // 🆕 ใช้พื้นหลังจริง (ไม่ใช้สีขาว)
                logging: false,
                
                // 🆕 Options สำคัญสำหรับ background
                removeContainer: false,
                imageTimeout: 15000,
                onclone: (clonedDoc, clonedElement) => {
                    // 🆕 บังคับให้ cloned element มี style ครบ
                    const allElements = clonedElement.getElementsByTagName('*');
                    for (let el of allElements) {
                        const computedStyle = window.getComputedStyle(el);
                        if (computedStyle.backgroundColor && 
                            computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                            computedStyle.backgroundColor !== 'transparent') {
                            el.style.backgroundColor = computedStyle.backgroundColor;
                        }
                    }
                }
            });

            // แปลงเป็น Image Data
            const imgData = canvas.toDataURL('image/png', 1.0);

            // เพิ่มหน้าใหม่ (ถ้าไม่ใช่ slide แรก)
            if (i > 0) {
                pdf.addPage([1280, 720], 'landscape');
            }

            // วาดภาพลง PDF
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            console.log(`✅ Slide ${i + 1} exported`);
        }

        // 8. ดาวน์โหลด PDF
        const fileName = `slides_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);

        alert(`✅ สร้าง PDF สำเร็จ!\nไฟล์: ${fileName}\nจำนวน: ${slides.length} สไลด์`);

        // 9. ล้าง iframe
        document.body.removeChild(tempIframe);

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
        // 10. คืนค่าปุ่ม
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        
        // ล้าง container
        document.getElementById('pdf-export-container').innerHTML = '';
    }
};
