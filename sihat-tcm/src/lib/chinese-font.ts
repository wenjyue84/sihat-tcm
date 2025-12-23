
import { jsPDF } from 'jspdf';

// URL for Noto Sans SC font (Simplified Chinese)
// This is a free font from Google Fonts, hosted on a CDN or raw info
const FONT_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.3/files/noto-sans-sc-chinese-simplified-400-normal.woff';
// Note: jsPDF has better support for TTF, but WOFF might work in modern browsers or if converted.
// If WOFF fails, we might need to find a direct TTF source or include a base64 subset.
// A more reliable TTF source for Noto Sans SC:
const FONT_URL_TTF = 'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf';
// Actually OTF is also supported by recent jsPDF in some environments, but let's try a safe bet.
// The most reliable way for browser-only pdf with mixed languages is often a base64 string, 
// but for a full CJK font it's too big (20MB+).
// We will try to fetch it.

export async function addChineseFont(doc: jsPDF): Promise<void> {
    try {
        console.log('Fetching Chinese font...');
        // We use a CDN link for Noto Sans SC Regular
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@latest/files/noto-sans-sc-chinese-simplified-400-normal.woff');

        if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.statusText}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64data = result.split(',')[1];

                if (base64data) {
                    // Add the font to VFS
                    const fileName = 'NotoSansSC-Regular.woff';
                    doc.addFileToVFS(fileName, base64data);

                    // Add the font to jsPDF
                    // Note: 'Identity-H' is often used for CJK encoding in PDF
                    doc.addFont(fileName, 'NotoSansSC', 'normal');

                    console.log('Chinese font added successfully');
                    resolve();
                } else {
                    reject(new Error('Failed to convert font to base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error adding Chinese font:', error);
        // We don't throw here to avoid breaking the whole PDF generation, 
        // but text might be garbage.
    }
}
