import { Button } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportPDFButton = ({ targetId, fileName = 'report.pdf' }) => {
  const handleExport = () => {
    const input = document.getElementById(targetId);
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    });
  };

  return (
    <Button variant="contained"  onClick={handleExport}>
      ייצוא ל־PDF
    </Button>
  );
};

export default ExportPDFButton;
