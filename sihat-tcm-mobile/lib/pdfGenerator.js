/**
 * PDF Report Generator for Sihat TCM Mobile
 * 
 * Uses expo-print to generate native PDF from HTML template.
 * Supports EN/ZH/MS languages with proper character rendering.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';
import { pdfTranslations } from './translations/pdfTranslations';
import { buildPdfHtml } from './templates/pdf/reportTemplate';

/**
 * Generate PDF and return file path
 * 
 * @param {Object} reportData - The report data from diagnosis
 * @param {Object} patientData - Patient information (name, age, gender, height, weight)
 * @param {Object} constitution - Constitution type object
 * @param {string} language - Language code 'en' | 'zh' | 'ms'
 * @returns {Promise<string|null>} - File path of generated PDF or null on error
 */
export const generateReportPdf = async (reportData, patientData, constitution, language = 'en') => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const html = buildPdfHtml(reportData, patientData, constitution, language);
        const t = pdfTranslations[language] || pdfTranslations.en;

        // Generate PDF file
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        // Create a user-friendly filename
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const fileName = `${t.fileName}_${date}.pdf`;

        // Move to a shareable location with proper name
        const newUri = `${FileSystem.documentDirectory}${fileName}`;

        // Check if file exists and remove it
        const fileInfo = await FileSystem.getInfoAsync(newUri);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(newUri);
        }

        await FileSystem.moveAsync({
            from: uri,
            to: newUri,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return newUri;

    } catch (error) {
        console.error('PDF Generation Error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return null;
    }
};

/**
 * Generate PDF and share it using native share sheet
 * 
 * @param {Object} reportData - The report data from diagnosis
 * @param {Object} patientData - Patient information
 * @param {Object} constitution - Constitution type object
 * @param {string} language - Language code
 * @returns {Promise<boolean>} - Success status
 */
export const generateAndSharePdf = async (reportData, patientData, constitution, language = 'en') => {
    try {
        const filePath = await generateReportPdf(reportData, patientData, constitution, language);

        if (!filePath) {
            throw new Error('Failed to generate PDF');
        }

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();

        if (isAvailable) {
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/pdf',
                dialogTitle: pdfTranslations[language]?.title || 'TCM Diagnosis Report',
                UTI: 'com.adobe.pdf', // iOS
            });
            return true;
        } else {
            // Fallback: Show alert with file path
            Alert.alert(
                'PDF Generated',
                `Your report has been saved to:\n${filePath}`,
                [{ text: 'OK' }]
            );
            return true;
        }
    } catch (error) {
        console.error('PDF Share Error:', error);
        Alert.alert(
            'Error',
            'Failed to generate PDF. Please try again.',
            [{ text: 'OK' }]
        );
        return false;
    }
};

export default {
    generateReportPdf,
    generateAndSharePdf,
    pdfTranslations,
};
