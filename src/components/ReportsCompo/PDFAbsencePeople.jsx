import React from 'react';
import { Button } from '@mui/material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { font, fontBold } from '../../fonts/AlefHebrew';
import dayjs from 'dayjs';

const ExportPDFButton = ({ 
  // תמיכה בטבלה אחת (השימוש הקיים)
  data, 
  columns, 
  
  // תמיכה במספר טבלאות (השימוש החדש)
  tables, // מערך של { data, columns, title?, customStyles? }
  betweenTablesContent, // מערך של טקסטים להציג בין הטבלאות
  
  // פרמטרים כלליים
  fileName, 
  title, 
  subtitle,
  reportDate,
  customStyles,
  buttonText = "ייצא ל-PDF",
  buttonProps = {},
  headerInfo = null,
  footerInfo = null,
  summaryData = null
}) => {
  
  // פונקציה להפיכת טקסט עברי למצב RTL נכון
  const reverseHebrewText = (text) => {
    if (!text) return text;
    
    // בדיקה אם יש טקסט עברי
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) {
      return text; // אם אין עברית, החזר כמו שהוא
    }
    
    // הפיכת הטקסט כדי להציג נכון ב-PDF
    return text.split('').reverse().join('');
  };

  // פונקציה לעיבוד טקסט מעורב (עברית + מספרים)
  const processHebrewText = (text) => {
    if (!text) return text;
    
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) {
      return text; // אין עברית
    }

    // אם יש גם מספרים וגם עברית, נטפל בזה בצורה מיוחדת
    const mixedRegex = /^(\d+\.?\s*)(.+)$/;
    const match = text.match(mixedRegex);
    
    if (match) {
      // יש מספר בתחילה - נשאיר את המספר במקום ונהפוך רק את החלק העברי
      const number = match[1];
      const hebrewPart = match[2];
      return number + reverseHebrewText(hebrewPart);
    }
    
    return reverseHebrewText(text);
  };
  
  const handleExport = () => {
    const doc = new jsPDF();
    
    // הוספת הפונטים העבריים
    try {
      doc.addFileToVFS('AlefHebrew.ttf', font);
      doc.addFont('AlefHebrew.ttf', 'AlefHebrew', 'normal');
      
      doc.addFileToVFS('AlefHebrew-Bold.ttf', fontBold);
      doc.addFont('AlefHebrew-Bold.ttf', 'AlefHebrew', 'bold');
      
      // הגדרת הפונט כברירת מחדל
      doc.setFont('AlefHebrew', 'normal');
    } catch (error) {
      console.error('Error loading fonts:', error);
      // שימוש בפונט ברירת מחדל
      doc.setFont('helvetica', 'normal');
    }

    // פונקציה לכתיבת טקסט עברי מימין לשמאל
    const writeHebrewText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', align = 'center' } = options;
      
      try {
        // הגדרת הפונט
        if (fontStyle === 'bold') {
          doc.setFont('AlefHebrew', 'bold');
        } else {
          doc.setFont('AlefHebrew', 'normal');
        }
      } catch (error) {
        doc.setFont('helvetica', fontStyle);
      }
      
      doc.setFontSize(fontSize);
      
      // עיבוד הטקסט לעברית
      const processedText = processHebrewText(text);
      
      // חישוב מיקום בהתאם ליישור
      let finalX = x;
      if (align === 'center') {
        const textWidth = doc.getTextWidth(processedText);
        finalX = (doc.internal.pageSize.width - textWidth) / 2;
      } else if (align === 'right') {
        const textWidth = doc.getTextWidth(processedText);
        finalX = doc.internal.pageSize.width - textWidth - 20;
      } else if (align === 'left') {
        finalX = 20;
      }
      
      doc.text(processedText, finalX, y);
    };

    // פונקציה ליצירת טבלה אחת
    const createTable = (tableData, tableColumns, tableCustomStyles, startY) => {
      // הכנת נתוני הטבלה עם עיבוד עברית
      const tableHeaders = tableColumns.map(col => processHebrewText(col.header || col.key));
      const tableBody = tableData.map(item => 
        tableColumns.map(col => {
          let value = '';
          if (col.formatter) {
            value = col.formatter(item[col.key], item);
          } else {
            value = item[col.key] || col.defaultValue || '';
          }
          
          // עיבוד הערך לעברית
          return processHebrewText(String(value));
        })
      );

      // הגדרות סגנון עם בדיקות בטיחות
      const safeCustomStyles = tableCustomStyles || customStyles || {};
      const styles = {
        font: 'AlefHebrew',
        fontSize: 10,
        cellPadding: 5,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
        fontStyle: 'normal',
        textColor: [0, 0, 0],
        ...(safeCustomStyles.styles || {})
      };

      const headStyles = {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        font: 'AlefHebrew',
        fontSize: 11,
        ...(safeCustomStyles.headStyles || {})
      };

      // יצירת הטבלה עם תמיכה ב-RTL
      autoTable(doc, {
        head: [tableHeaders],
        body: tableBody,
        startY: startY,
        theme: 'grid',
        styles: styles,
        headStyles: headStyles,
        columnStyles: safeCustomStyles.columnStyles || {},
        tableLineWidth: 0.1,
        tableLineColor: [0, 0, 0],
        rowPageBreak: 'avoid',
        
        // callback functions עם תמיכה בעברית
        didParseCell: function(data) {
          if (data && data.styles) {
            try {
              data.styles.font = 'AlefHebrew';
              if (data.section === 'head') {
                data.styles.fontStyle = 'bold';
              } else {
                data.styles.fontStyle = 'normal';
              }
              
              // וידוא שהטקסט מעובד נכון
              if (data.cell && data.cell.text && Array.isArray(data.cell.text)) {
                data.cell.text = data.cell.text.map(text => processHebrewText(String(text)));
              }
            } catch (error) {
              console.warn('Font setting error in didParseCell:', error);
            }
          }
        },
        
        willDrawCell: function(data) {
          try {
            if (data && data.section === 'head') {
              doc.setFont('AlefHebrew', 'bold');
            } else {
              doc.setFont('AlefHebrew', 'normal');
            }
          } catch (error) {
            doc.setFont('helvetica', 'normal');
          }
        },
        
        ...(safeCustomStyles.tableOptions || {})
      });

      return doc.lastAutoTable?.finalY || startY + 50;
    };

    let yPosition = 20;

    // כותרת ראשית
    if (title) {
      writeHebrewText(title, 0, yPosition, { fontSize: 18, fontStyle: 'bold', align: 'center' });
      yPosition += 10;
    }

    // כותרת משנה
    if (subtitle) {
      writeHebrewText(subtitle, 0, yPosition, { fontSize: 14, align: 'center' });
      yPosition += 15;
    }

    // מידע נוסף בכותרת
    if (headerInfo) {
      headerInfo.forEach(info => {
        writeHebrewText(info, 0, yPosition, { fontSize: 12, align: 'center' });
        yPosition += 7;
      });
      yPosition += 10;
    }

    // נתוני סיכום (אם קיימים)
    if (summaryData) {
      summaryData.forEach(summary => {
        writeHebrewText(summary, 0, yPosition, { fontSize: 16, fontStyle: 'bold', align: 'center' });
        yPosition += 8;
      });
      yPosition += 15;
    }

    // יצירת הטבלאות
    if (tables && Array.isArray(tables)) {
      // מצב חדש - מספר טבלאות
      tables.forEach((table, index) => {
        // כותרת לטבלה (אם קיימת)
        if (table.title) {
          writeHebrewText(table.title, 0, yPosition, { fontSize: 14, fontStyle: 'bold', align: 'center' });
          yPosition += 10;
        }

        // יצירת הטבלה
        yPosition = createTable(table.data, table.columns, table.customStyles, yPosition);

        // הוספת תוכן בין הטבלאות (אם זה לא הטבלה האחרונה)
        if (index < tables.length - 1) {
          yPosition += 15; // רווח לפני התוכן

          if (betweenTablesContent && Array.isArray(betweenTablesContent)) {
            betweenTablesContent.forEach(content => {
              if (content) {
                writeHebrewText(content, 0, yPosition, { fontSize: 12, align: 'center' });
                yPosition += 8;
              }
            });
          }

          yPosition += 15; // רווח לאחר התוכן
        }
      });
    } else if (data && columns) {
      // מצב קיים - טבלה אחת
      yPosition = createTable(data, columns, customStyles, yPosition);
    }

    // מידע בתחתית הדף
    if (footerInfo && Array.isArray(footerInfo)) {
      const finalY = doc.lastAutoTable?.finalY || yPosition + 50;
      
      footerInfo.forEach((info, index) => {
        if (info && info.text) {
          const footerY = finalY + 20 + (index * 7);
          writeHebrewText(info.text, 0, footerY, { 
            fontSize: 10, 
            align: info.align || 'center' 
          });
        }
      });
    }

    // שמירת הקובץ
    const finalFileName = fileName || `דוח_${dayjs().format('DD-MM-YYYY')}.pdf`;
    doc.save(finalFileName);
  };

  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleExport}
      {...buttonProps}
    >
      {buttonText}
    </Button>
  );
};

export default ExportPDFButton;