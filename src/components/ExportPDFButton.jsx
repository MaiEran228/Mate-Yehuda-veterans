import React from 'react';
import { Button } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExportPDFButton = ({ targetId, fileName = 'document.pdf' }) => {
  const exportToPDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      alert('לא נמצא אלמנט לייצוא');
      return;
    }

    try {
      // הוספת מחלקה למצב הדפסה
      element.classList.add('printing');
      
      // המתנה קצרה כדי שהסגנונות יתעדכנו
      await new Promise(resolve => setTimeout(resolve, 200));

      const captureElements = [];

      // לכידת כותרת וסיכום כיחידה אחת
      const headerSection = element.querySelector('.header-section');
      const summarySection = element.querySelector('.summary-section');
      
      if (headerSection && summarySection) {
        // יצירת div זמני שמכיל את הכותרת והסיכום
        const headerSummaryContainer = document.createElement('div');
        headerSummaryContainer.style.cssText = `
          background: white;
          padding: 20px;
          width: ${element.offsetWidth}px;
        `;
        
        // שכפול הכותרת והסיכום
        const headerClone = headerSection.cloneNode(true);
        const summaryClone = summarySection.cloneNode(true);
        
        headerSummaryContainer.appendChild(headerClone);
        headerSummaryContainer.appendChild(summaryClone);
        
        // הוספה זמנית ל-DOM
        document.body.appendChild(headerSummaryContainer);
        
        const headerCanvas = await html2canvas(headerSummaryContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          letterRendering: true,
          imageTimeout: 0
        });
        
        captureElements.push({
          canvas: headerCanvas,
          type: 'header',
          height: headerCanvas.height
        });
        
        // הסרה מה-DOM
        document.body.removeChild(headerSummaryContainer);
      }

      // לכידת כותרת "רשימת נוכחים"
      const presentTitleElement = element.querySelector('.present-section h6');
      if (presentTitleElement) {
        const titleCanvas = await html2canvas(presentTitleElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          letterRendering: true,
          imageTimeout: 0
        });
        
        captureElements.push({
          canvas: titleCanvas,
          type: 'section-title',
          height: titleCanvas.height
        });
      }

      // לכידת כל פרופיל נוכח בנפרד עם הקטנה
      const presentProfiles = element.querySelectorAll('.present-section .MuiBox-root:not(:first-child) > .MuiBox-root');
      for (let i = 0; i < presentProfiles.length; i++) {
        const profile = presentProfiles[i];
        
        // הקטנת הפרופיל זמנית עבור הלכידה
        const originalStyle = profile.style.cssText;
        profile.style.cssText += 'transform: scale(0.85); transform-origin: top right; font-size: 0.8em;';
        
        const profileCanvas = await html2canvas(profile, {
          scale: 1.8, // הקטנת scale קלה
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#e8f5e8',
          letterRendering: true,
          imageTimeout: 0
        });
        
        // החזרת הסטייל המקורי
        profile.style.cssText = originalStyle;
        
        captureElements.push({
          canvas: profileCanvas,
          type: 'present-profile',
          height: profileCanvas.height,
          index: i
        });
      }

      // לכידת כותרת "רשימת נעדרים"
      const absentTitleElement = element.querySelector('.absent-section h6');
      if (absentTitleElement) {
        const titleCanvas = await html2canvas(absentTitleElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          letterRendering: true,
          imageTimeout: 0
        });
        
        captureElements.push({
          canvas: titleCanvas,
          type: 'section-title',
          height: titleCanvas.height
        });
      }

      // לכידת כל פרופיל נעדר בנפרד עם הקטנה
      const absentProfiles = element.querySelectorAll('.absent-section .MuiBox-root:not(:first-child) > .MuiBox-root');
      for (let i = 0; i < absentProfiles.length; i++) {
        const profile = absentProfiles[i];
        
        // הקטנת הפרופיל זמנית עבור הלכידה
        const originalStyle = profile.style.cssText;
        profile.style.cssText += 'transform: scale(0.85); transform-origin: top right; font-size: 0.8em;';
        
        const profileCanvas = await html2canvas(profile, {
          scale: 1.8, // הקטנת scale קלה
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffebee',
          letterRendering: true,
          imageTimeout: 0
        });
        
        // החזרת הסטייל המקורי
        profile.style.cssText = originalStyle;
        
        captureElements.push({
          canvas: profileCanvas,
          type: 'absent-profile',
          height: profileCanvas.height,
          index: i
        });
      }

      // לכידת כותרת התחתונה
      const footerSection = element.querySelector('.footer-section');
      if (footerSection) {
        const footerCanvas = await html2canvas(footerSection, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          letterRendering: true,
          imageTimeout: 0
        });
        
        captureElements.push({
          canvas: footerCanvas,
          type: 'footer',
          height: footerCanvas.height
        });
      }

      // הסרת מחלקת ההדפסה
      element.classList.remove('printing');

      // יצירת PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      let currentPageHeight = 0;
      let isFirstPage = true;
      
      // מעבר על כל האלמנטים שנלכדו
      for (let i = 0; i < captureElements.length; i++) {
        const element = captureElements[i];
        const imgData = element.canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = availableWidth;
        const imgHeight = (element.height * imgWidth) / element.canvas.width;
        
        // בדיקה מיוחדת לפרופילים - 3 עמודות במקום 2
        if (element.type === 'present-profile' || element.type === 'absent-profile') {
          const columnsPerRow = 3; // 3 עמודות
          const spacing = 3; // רווח בין עמודות
          const profileWidth = (availableWidth - (spacing * (columnsPerRow - 1))) / columnsPerRow;
          const profileHeight = (element.height * profileWidth * 0.8) / element.canvas.width; // הקטנת גובה ב-20%
          
          // בדיקה אם זה תחילת סוג חדש של פרופילים או שצריך עמוד חדש
          if (currentPageHeight + profileHeight > availableHeight) {
            pdf.addPage();
            currentPageHeight = 0;
          }
          
          // חישוב מיקום לפי מספר העמודה (0, 1, 2)
          const columnIndex = element.index % columnsPerRow;
          const xPosition = margin + (columnIndex * (profileWidth + spacing));
          
          // אם זו עמודה ראשונה של שורה חדשה, נוסיף רווח
          if (columnIndex === 0 && element.index > 0) {
            currentPageHeight += 2; // רווח קטן יותר בין שורות
          }
          
          pdf.addImage(imgData, 'JPEG', xPosition, margin + currentPageHeight, profileWidth, profileHeight, '', 'FAST');
          
          // עדכון גובה הדף רק אחרי העמודה האחרונה בשורה או הפרופיל האחרון
          const isLastInRow = columnIndex === columnsPerRow - 1;
          const isLastProfile = element.index === captureElements.filter(el => el.type === element.type).length - 1;
          
          if (isLastInRow || isLastProfile) {
            currentPageHeight += profileHeight;
          }
          
        } else {
          // עבור אלמנטים אחרים (כותרות, סיכום וכו')
          if (!isFirstPage && (currentPageHeight + imgHeight > availableHeight)) {
            pdf.addPage();
            currentPageHeight = 0;
          }
          
          pdf.addImage(imgData, 'JPEG', margin, margin + currentPageHeight, imgWidth, imgHeight, '', 'FAST');
          currentPageHeight += imgHeight + 5;
          
          // בדיקה אם נגמר מקום בעמוד
          if (currentPageHeight >= availableHeight - 20) {
            if (i < captureElements.length - 1) {
              pdf.addPage();
              currentPageHeight = 0;
            }
          }
        }
        
        isFirstPage = false;
      }

      // שמירת הקובץ
      pdf.save(fileName);
      
      console.log(`PDF נוצר בהצלחה עם ${captureElements.length} אלמנטים נפרדים`);
      
    } catch (error) {
      console.error('שגיאה ביצירת PDF:', error);
      alert('שגיאה ביצירת קובץ PDF. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
    } finally {
      // וידוא הסרת מחלקת ההדפסה
      element.classList.remove('printing');
    }
  };

  return (
    <Button
      variant="contained"
      onClick={exportToPDF}
      sx={{
        ml: 2,
        '&:focus': {
          outline: 'none'
        },
        '&:active': {
          outline: 'none'
        }
      }}
    >
      ייצוא ל־PDF
    </Button>
  );
};

export default ExportPDFButton;
