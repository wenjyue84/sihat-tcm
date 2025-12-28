/**
 * PDF Report HTML Template Builder
 * 
 * Generates the HTML string for the PDF report.
 */

import { pdfTranslations } from '../../translations/pdfTranslations';

/**
 * Helper: Extract string from various data formats.
 */
const extractString = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        if (val.primary_pattern) return val.primary_pattern;
        if (val.type) return val.type;
        if (val.summary) return val.summary;
        return Object.entries(val)
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
            .join(', ');
    }
    return String(val);
};

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightM = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (heightM > 0 && w > 0) {
        return (w / (heightM * heightM)).toFixed(1);
    }
    return null;
};

/**
 * Build bullet list HTML
 */
const buildBulletList = (items, color = '#059669') => {
    if (!items || items.length === 0) return '';
    return items.map(item => `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <span style="color: ${color}; font-size: 18px; line-height: 1.2;">•</span>
            <span style="color: #374151; font-size: 12px; line-height: 1.5;">${item}</span>
        </div>
    `).join('');
};

/**
 * Build the complete HTML template for PDF
 */
export const buildPdfHtml = (reportData, patientData, constitution, language = 'en') => {
    const t = pdfTranslations[language] || pdfTranslations.en;

    // Get localized date
    const dateLocale = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US';
    const formattedDate = new Date().toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Extract data safely
    const diagnosisText = extractString(reportData?.diagnosis, 'Pending Analysis');
    const constitutionType = reportData?.constitution?.type || constitution?.type || 'Unknown';
    const constitutionDesc = reportData?.constitution?.description || constitution?.description || '';
    const analysisText = extractString(reportData?.analysis, '');

    const foods = reportData?.recommendations?.food || [];
    const avoid = reportData?.recommendations?.avoid || [];
    const lifestyle = reportData?.recommendations?.lifestyle || [];
    const acupoints = reportData?.recommendations?.acupoints || [];
    const exercise = reportData?.recommendations?.exercise || [];
    const sleepGuidance = reportData?.recommendations?.sleep_guidance || '';
    const emotionalCare = reportData?.recommendations?.emotional_care || '';
    const herbalFormulas = reportData?.recommendations?.herbal_formulas || [];
    const keyFindings = reportData?.analysis?.key_findings || {};

    const bmi = calculateBMI(patientData?.height, patientData?.weight);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1f2937;
            line-height: 1.6;
            padding: 40px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #10b981;
        }
        
        .header h1 {
            color: #065f46;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .header h2 {
            color: #6b7280;
            font-size: 14px;
            font-weight: 400;
        }
        
        .header .date {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 10px;
        }
        
        .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
        }
        
        .section-title {
            background: linear-gradient(90deg, #065f46, #059669);
            color: white;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px 6px 0 0;
            margin-bottom: 0;
        }
        
        .section-content {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 6px 6px;
            padding: 16px;
        }
        
        .diagnosis-highlight {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .diagnosis-highlight h3 {
            color: #065f46;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .diagnosis-highlight p {
            color: #047857;
            font-size: 14px;
        }
        
        .patient-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        
        .patient-item {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .patient-item .label {
            color: #6b7280;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        
        .patient-item .value {
            color: #1f2937;
            font-size: 14px;
            font-weight: 600;
        }
        
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        
        .column-box {
            background: white;
            border-radius: 6px;
            padding: 12px;
            border: 1px solid #e5e7eb;
        }
        
        .column-box h4 {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .column-box.good h4 { color: #059669; }
        .column-box.bad h4 { color: #dc2626; }
        
        .herbal-card {
            background: white;
            border-radius: 6px;
            padding: 12px;
            border: 1px solid #d97706;
            border-left: 4px solid #f59e0b;
            margin-bottom: 10px;
        }
        
        .herbal-card h5 {
            color: #92400e;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .herbal-card p {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 3px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .footer p {
            color: #9ca3af;
            font-size: 10px;
            margin-bottom: 4px;
        }
        
        .footer .logo {
            color: #10b981;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .key-finding {
            background: white;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 8px;
            border-left: 3px solid #10b981;
        }
        
        .key-finding .type {
            color: #059669;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .key-finding .text {
            color: #374151;
            font-size: 12px;
        }
        
        .tip-box {
            background: #fef3c7;
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
            font-size: 11px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>🌿 ${t.title}</h1>
        <h2>${t.subtitle}</h2>
        <div class="date">${t.generated}: ${formattedDate}</div>
    </div>
    
    <!-- Patient Information -->
    ${patientData && (patientData.name || patientData.age || patientData.gender) ? `
    <div class="section">
        <div class="section-title">${t.patientInfo}</div>
        <div class="section-content">
            <div class="patient-grid">
                ${patientData.name ? `
                <div class="patient-item">
                    <div class="label">${t.name}</div>
                    <div class="value">${patientData.name}</div>
                </div>` : ''}
                ${patientData.age ? `
                <div class="patient-item">
                    <div class="label">${t.age}</div>
                    <div class="value">${patientData.age} ${t.years}</div>
                </div>` : ''}
                ${patientData.gender ? `
                <div class="patient-item">
                    <div class="label">${t.gender}</div>
                    <div class="value">${patientData.gender}</div>
                </div>` : ''}
                ${patientData.height ? `
                <div class="patient-item">
                    <div class="label">${t.height}</div>
                    <div class="value">${patientData.height} ${t.cm}</div>
                </div>` : ''}
                ${patientData.weight ? `
                <div class="patient-item">
                    <div class="label">${t.weight}</div>
                    <div class="value">${patientData.weight} ${t.kg}</div>
                </div>` : ''}
                ${bmi ? `
                <div class="patient-item">
                    <div class="label">${t.bmi}</div>
                    <div class="value">${bmi}</div>
                </div>` : ''}
            </div>
        </div>
    </div>
    ` : ''}
    
    <!-- Main Diagnosis -->
    <div class="diagnosis-highlight">
        <h3>${diagnosisText}</h3>
        <p>${t.constitution}: ${constitutionType}</p>
        ${constitutionDesc ? `<p style="margin-top: 8px; font-size: 12px; color: #6b7280;">${constitutionDesc}</p>` : ''}
    </div>
    
    <!-- Detailed Analysis -->
    ${analysisText ? `
    <div class="section">
        <div class="section-title">${t.detailedAnalysis}</div>
        <div class="section-content">
            <p style="color: #374151; font-size: 12px; margin-bottom: 12px;">${analysisText}</p>
            ${keyFindings && (keyFindings.from_inquiry || keyFindings.from_visual || keyFindings.from_pulse) ? `
            <div style="margin-top: 12px;">
                <p style="font-weight: 600; font-size: 12px; color: #065f46; margin-bottom: 8px;">${t.keyFindings}:</p>
                ${keyFindings.from_inquiry ? `
                <div class="key-finding">
                    <div class="type">${t.fromInquiry}</div>
                    <div class="text">${keyFindings.from_inquiry}</div>
                </div>` : ''}
                ${keyFindings.from_visual ? `
                <div class="key-finding">
                    <div class="type">${t.fromVisual}</div>
                    <div class="text">${keyFindings.from_visual}</div>
                </div>` : ''}
                ${keyFindings.from_pulse ? `
                <div class="key-finding">
                    <div class="type">${t.fromPulse}</div>
                    <div class="text">${keyFindings.from_pulse}</div>
                </div>` : ''}
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}
    
    <!-- Dietary Recommendations -->
    ${foods.length > 0 || avoid.length > 0 ? `
    <div class="section">
        <div class="section-title">${t.dietaryRecommendations}</div>
        <div class="section-content">
            <div class="two-columns">
                ${foods.length > 0 ? `
                <div class="column-box good">
                    <h4>✓ ${t.recommendedFoods}</h4>
                    ${buildBulletList(foods, '#059669')}
                </div>` : ''}
                ${avoid.length > 0 ? `
                <div class="column-box bad">
                    <h4>✗ ${t.foodsToAvoid}</h4>
                    ${buildBulletList(avoid, '#dc2626')}
                </div>` : ''}
            </div>
        </div>
    </div>
    ` : ''}
    
    <!-- Lifestyle Recommendations -->
    ${lifestyle.length > 0 ? `
    <div class="section">
        <div class="section-title">${t.lifestyleRecommendations}</div>
        <div class="section-content">
            ${buildBulletList(lifestyle, '#059669')}
        </div>
    </div>
    ` : ''}
    
    <!-- Acupressure Points -->
    ${acupoints.length > 0 ? `
    <div class="section">
        <div class="section-title">${t.acupressurePoints}</div>
        <div class="section-content">
            ${buildBulletList(acupoints, '#6366f1')}
            <div class="tip-box">💡 ${t.acupointTip}</div>
        </div>
    </div>
    ` : ''}
    
    <!-- Exercise -->
    ${exercise.length > 0 ? `
    <div class="section">
        <div class="section-title">${t.exercise}</div>
        <div class="section-content">
            ${buildBulletList(exercise, '#0891b2')}
        </div>
    </div>
    ` : ''}
    
    <!-- Rest & Wellness -->
    ${sleepGuidance || emotionalCare ? `
    <div class="section">
        <div class="section-title">${t.restWellness}</div>
        <div class="section-content">
            <div class="two-columns">
                ${sleepGuidance ? `
                <div class="column-box" style="border-left: 3px solid #8b5cf6;">
                    <h4 style="color: #6d28d9;">🌙 ${t.sleepGuidance}</h4>
                    <p style="color: #374151; font-size: 12px;">${sleepGuidance}</p>
                </div>` : ''}
                ${emotionalCare ? `
                <div class="column-box" style="border-left: 3px solid #ec4899;">
                    <h4 style="color: #be185d;">❤️ ${t.emotionalCare}</h4>
                    <p style="color: #374151; font-size: 12px;">${emotionalCare}</p>
                </div>` : ''}
            </div>
        </div>
    </div>
    ` : ''}
    
    <!-- Herbal Formulas -->
    ${herbalFormulas.length > 0 ? `
    <div class="section">
        <div class="section-title">${t.herbalFormulas}</div>
        <div class="section-content">
            ${herbalFormulas.map(formula => `
            <div class="herbal-card">
                <h5>🌿 ${formula.name}</h5>
                ${formula.purpose ? `<p><strong>${t.purpose}:</strong> ${formula.purpose}</p>` : ''}
                ${formula.ingredients && formula.ingredients.length > 0 ? `<p><strong>${t.ingredients}:</strong> ${formula.ingredients.join(', ')}</p>` : ''}
                ${formula.dosage ? `<p><strong>${t.dosage}:</strong> ${formula.dosage}</p>` : ''}
            </div>
            `).join('')}
            <div class="tip-box">⚠️ Consult a licensed TCM practitioner before taking herbal medicine.</div>
        </div>
    </div>
    ` : ''}
    
    <!-- Footer / Disclaimer -->
    <div class="footer">
        <p>${t.disclaimer1}</p>
        <p>${t.disclaimer2}</p>
        <div class="logo">🌿 Sihat TCM</div>
    </div>
</body>
</html>
`;
};
