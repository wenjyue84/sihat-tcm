// Chinese font module for jsPDF
// This adds Noto Sans SC (Simplified Chinese) support to jsPDF

import { jsPDF } from 'jspdf';

// Font data (base64 encoded subset - for demonstration)
// In production, you would include the full font file or a proper subset
const notoSansSCNormal = 'AAEAAAALAIAAAwAwT1MvMg8SBfAAAAC8AAAAYGNtYXABIwH...'; // Truncated for brevity

export function addChineseFont(doc: jsPDF) {
    // For now, we'll use a workaround approach
    // jsPDF 3.x has built-in support for some fonts
    // We'll conditionally apply Chinese font
    try {
        // Attempt to use available fonts
        // In a real implementation, you'd add the custom font file here
        doc.addFileToVFS('NotoSansSC-normal.ttf', notoSansSCNormal);
        doc.addFont('NotoSansSC-normal.ttf', 'NotoSansSC', 'normal');
    } catch (e) {
        console.warn('Could not add Chinese font:', e);
    }
}

export function setChineseFont(doc: jsPDF) {
    try {
        doc.setFont('NotoSansSC', 'normal');
    } catch (e) {
        // Fallback to default
        doc.setFont('helvetica', 'normal');
    }
}
