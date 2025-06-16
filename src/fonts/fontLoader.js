import { jsPDF } from 'jspdf';
import { font as alefRegular, fontBold as alefBold } from './AlefHebrew';

// פונקציה גלובלית לוידוא שהפונטים נטענו
export const ensureFontsLoaded = (doc) => {
    try {
        // הוספת הפונטים ל-PDF
        doc.addFileToVFS('AlefHebrew.ttf', alefRegular);
        doc.addFont('AlefHebrew.ttf', 'AlefHebrew', 'normal');
        
        doc.addFileToVFS('AlefHebrew-Bold.ttf', alefBold);
        doc.addFont('AlefHebrew-Bold.ttf', 'AlefHebrew', 'bold');
        
        // הגדרת הפונט כברירת מחדל
        doc.setFont('AlefHebrew', 'normal');
    } catch (error) {
        console.error('Error loading fonts:', error);
        // fallback לפונט ברירת מחדל
        doc.setFont('helvetica', 'normal');
    }
};

export { alefRegular as font, alefBold as fontBold };