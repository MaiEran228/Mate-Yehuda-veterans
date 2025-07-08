import { jsPDF } from 'jspdf';
import { font as alefRegular, fontBold as alefBold } from './AlefHebrew';

// global function to check if the fonts are loaded
export const ensureFontsLoaded = (doc) => {
    try {
        // add the fonts to the PDF
        doc.addFileToVFS('AlefHebrew.ttf', alefRegular);
        doc.addFont('AlefHebrew.ttf', 'AlefHebrew', 'normal');
        
        doc.addFileToVFS('AlefHebrew-Bold.ttf', alefBold);
        doc.addFont('AlefHebrew-Bold.ttf', 'AlefHebrew', 'bold');
        
        // set the font as default
        doc.setFont('AlefHebrew', 'normal');
    } catch (error) {
        console.error('Error loading fonts:', error);
        // fallback to the default font
        doc.setFont('helvetica', 'normal');
    }
};

export { alefRegular as font, alefBold as fontBold };