import React from 'react';
import { Button } from '@mui/material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { font, fontBold } from '../../fonts/AlefHebrew';
import dayjs from 'dayjs';

const ExportPDFButton = ({ 
  // Support for a single table (current usage)
  data, 
  columns, 
  
  // Support for multiple tables (new usage)
  tables, // Array of { data, columns, title?, customStyles? }
  betweenTablesContent, // Array of texts to display between tables
  
  // General parameters
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
  
  // Function to reverse Hebrew text for correct RTL display
  const reverseHebrewText = (text) => {
    if (!text) return text;
    
    // Check if there is Hebrew text
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) {
      return text; // If no Hebrew, return as is
    }
    
    // Reverse the text for correct PDF display
    return text.split('').reverse().join('');
  };

  // Function to process mixed text (Hebrew + numbers)
  const processHebrewText = (text) => {
    if (!text) return text;
    
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(text)) {
      return text; // No Hebrew
    }

    // If there are both numbers and Hebrew, handle specially
    const mixedRegex = /^(\d+\.?\s*)(.+)$/;
    const match = text.match(mixedRegex);
    
    if (match) {
      // There is a number at the start - keep the number and reverse only the Hebrew part
      const number = match[1];
      const hebrewPart = match[2];
      return number + reverseHebrewText(hebrewPart);
    }
    
    return reverseHebrewText(text);
  };
  
  const handleExport = () => {
    const doc = new jsPDF();
    
    // Add Hebrew fonts
    try {
      doc.addFileToVFS('AlefHebrew.ttf', font);
      doc.addFont('AlefHebrew.ttf', 'AlefHebrew', 'normal');
      
      doc.addFileToVFS('AlefHebrew-Bold.ttf', fontBold);
      doc.addFont('AlefHebrew-Bold.ttf', 'AlefHebrew', 'bold');
      
      // Set the font as default
      doc.setFont('AlefHebrew', 'normal');
    } catch (error) {
      console.error('Error loading fonts:', error);
      // Use default font
      doc.setFont('helvetica', 'normal');
    }

    // Function to write Hebrew text RTL
    const writeHebrewText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', align = 'center' } = options;
      
      try {
        // Set the font
        if (fontStyle === 'bold') {
          doc.setFont('AlefHebrew', 'bold');
        } else {
          doc.setFont('AlefHebrew', 'normal');
        }
      } catch (error) {
        doc.setFont('helvetica', fontStyle);
      }
      
      doc.setFontSize(fontSize);
      
      // Process the text for Hebrew
      const processedText = processHebrewText(text);
      
      // Calculate position according to alignment
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

    // Function to create a single table
    const createTable = (tableData, tableColumns, tableCustomStyles, startY) => {
      // Prepare table data with Hebrew processing
      const tableHeaders = tableColumns.map(col => processHebrewText(col.header || col.key));
      const tableBody = tableData.map(item => 
        tableColumns.map(col => {
          let value = '';
          if (col.formatter) {
            value = col.formatter(item[col.key], item);
          } else {
            value = item[col.key] || col.defaultValue || '';
          }
          
          // Process the value for Hebrew
          return processHebrewText(String(value));
        })
      );

      // Style settings with safety checks
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

      // Create the table with RTL support
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
        
        // Callback functions with Hebrew support
        didParseCell: function(data) {
          if (data && data.styles) {
            try {
              data.styles.font = 'AlefHebrew';
              if (data.section === 'head') {
                data.styles.fontStyle = 'bold';
              } else {
                data.styles.fontStyle = 'normal';
              }
              
              // Ensure the text is processed correctly
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

    // Main title
    if (title) {
      writeHebrewText(title, 0, yPosition, { fontSize: 18, fontStyle: 'bold', align: 'center' });
      yPosition += 10;
    }

    // Subtitle
    if (subtitle) {
      writeHebrewText(subtitle, 0, yPosition, { fontSize: 14, align: 'center' });
      yPosition += 15;
    }

    // Additional header info
    if (headerInfo) {
      headerInfo.forEach(info => {
        writeHebrewText(info, 0, yPosition, { fontSize: 12, align: 'center' });
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Summary data (if exists)
    if (summaryData) {
      summaryData.forEach(summary => {
        writeHebrewText(summary, 0, yPosition, { fontSize: 16, fontStyle: 'bold', align: 'center' });
        yPosition += 8;
      });
      yPosition += 15;
    }

    // Create the tables
    if (tables && Array.isArray(tables)) {
      // New mode - multiple tables
      tables.forEach((table, index) => {
        // Table title (if exists)
        if (table.title) {
          writeHebrewText(table.title, 0, yPosition, { fontSize: 14, fontStyle: 'bold', align: 'center' });
          yPosition += 10;
        }

        // Create the table
        yPosition = createTable(table.data, table.columns, table.customStyles, yPosition);

        // Add content between tables (if not the last table)
        if (index < tables.length - 1) {
          yPosition += 15; // Space before content

          if (betweenTablesContent && Array.isArray(betweenTablesContent)) {
            betweenTablesContent.forEach(content => {
              if (content) {
                writeHebrewText(content, 0, yPosition, { fontSize: 12, align: 'center' });
                yPosition += 8;
              }
            });
          }

          yPosition += 15; // Space after content
        }
      });
    } else if (data && columns) {
      // Existing mode - single table
      yPosition = createTable(data, columns, customStyles, yPosition);
    }

    // Footer info at the bottom of the page
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

    // Save the file
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