import React from 'react';
import { Button } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExportPDFButton = ({ targetId, fileName = 'document.pdf' }) => {
  const exportToPDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // יצירת PDF עם תמיכה בעברית
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      // הוספת עמודים נוספים אם צריך
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
        page++;
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={exportToPDF}
      sx={{
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