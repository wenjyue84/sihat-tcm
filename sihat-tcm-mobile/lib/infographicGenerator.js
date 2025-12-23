/**
 * Infographic Generator for Sihat TCM Mobile
 * 
 * Generates styled SVG infographics from TCM diagnosis reports.
 * Supports 4 visual styles and customizable content sections.
 */

// Style configurations with color palettes
export const INFOGRAPHIC_STYLES = {
    modern: {
        id: 'modern',
        name: 'Modern',
        description: 'Clean, professional',
        colors: ['#10b981', '#3b82f6', '#f8fafc'],
        primary: '#10b981',
        secondary: '#3b82f6',
        background: '#f8fafc',
        text: '#1e293b',
        accent: '#10b981',
    },
    traditional: {
        id: 'traditional',
        name: 'Traditional',
        description: 'Classic TCM aesthetic',
        colors: ['#7c3aed', '#dc2626', '#fef3c7'],
        primary: '#dc2626',
        secondary: '#9333ea',
        background: '#fef3c7',
        text: '#1c1917',
        accent: '#dc2626',
    },
    minimal: {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple, elegant',
        colors: ['#1f2937', '#6b7280', '#ffffff'],
        primary: '#374151',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#1f2937',
        accent: '#374151',
    },
    colorful: {
        id: 'colorful',
        name: 'Colorful',
        description: 'Vibrant, engaging',
        colors: ['#f43f5e', '#8b5cf6', '#06b6d4'],
        primary: '#8b5cf6',
        secondary: '#f43f5e',
        background: '#fdf4ff',
        text: '#18181b',
        accent: '#8b5cf6',
    },
};

// Content section options
export const CONTENT_OPTIONS = [
    { id: 'diagnosis', icon: 'medical-outline', default: true },
    { id: 'dietary', icon: 'nutrition-outline', default: true },
    { id: 'lifestyle', icon: 'leaf-outline', default: true },
    { id: 'acupoints', icon: 'locate-outline', default: false },
    { id: 'exercise', icon: 'fitness-outline', default: false },
    { id: 'metrics', icon: 'analytics-outline', default: false },
];

// Helper to escape XML/SVG special characters
const escapeXml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// Helper to truncate text
const truncate = (str, maxLength = 40) => {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLength ? s.substring(0, maxLength) + '...' : s;
};

// Extract string from various data formats
const extractString = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        if (val.primary_pattern) return val.primary_pattern;
        if (val.type) return val.type;
        return JSON.stringify(val);
    }
    return String(val);
};

/**
 * Build infographic content based on selected options
 */
export const buildInfographicContent = (reportData, patientData, constitution, content) => {
    const sections = [];

    if (content.diagnosis) {
        const diagnosis = extractString(reportData?.diagnosis, 'TCM Diagnosis');
        const constitutionType = constitution?.type || reportData?.constitution?.type || '';
        sections.push({
            type: 'diagnosis',
            title: '📋 Diagnosis',
            primary: truncate(diagnosis, 50),
            secondary: constitutionType ? `Constitution: ${constitutionType}` : null,
        });
    }

    if (content.dietary) {
        const foods = reportData?.recommendations?.food?.slice(0, 4)
            || reportData?.recommendations?.food_therapy?.beneficial?.slice(0, 4)
            || [];
        const avoid = reportData?.recommendations?.avoid?.slice(0, 3)
            || reportData?.recommendations?.food_therapy?.avoid?.slice(0, 3)
            || [];
        if (foods.length > 0 || avoid.length > 0) {
            sections.push({
                type: 'dietary',
                title: '🥗 Dietary Therapy',
                beneficial: foods,
                avoid: avoid,
            });
        }
    }

    if (content.lifestyle) {
        const lifestyle = reportData?.recommendations?.lifestyle?.slice(0, 3) || [];
        if (lifestyle.length > 0) {
            sections.push({
                type: 'lifestyle',
                title: '🌿 Lifestyle',
                items: lifestyle,
            });
        }
    }

    if (content.acupoints) {
        const acupoints = reportData?.recommendations?.acupoints?.slice(0, 3) || [];
        if (acupoints.length > 0) {
            sections.push({
                type: 'acupoints',
                title: '📍 Acupoints',
                items: acupoints,
            });
        }
    }

    if (content.exercise) {
        const exercise = reportData?.recommendations?.exercise?.slice(0, 3) || [];
        if (exercise.length > 0) {
            sections.push({
                type: 'exercise',
                title: '🏃 Exercise',
                items: exercise,
            });
        }
    }

    if (content.metrics && patientData) {
        const metrics = [];
        if (patientData.age) metrics.push(`Age: ${patientData.age}`);
        if (patientData.height && patientData.weight) {
            const heightM = parseFloat(patientData.height) / 100;
            const weight = parseFloat(patientData.weight);
            if (heightM > 0 && weight > 0) {
                const bmi = (weight / (heightM * heightM)).toFixed(1);
                metrics.push(`BMI: ${bmi}`);
            }
        }
        if (metrics.length > 0) {
            sections.push({
                type: 'metrics',
                title: '📊 Metrics',
                items: metrics,
            });
        }
    }

    return sections;
};

/**
 * Generate SVG infographic as a string
 * 
 * @param {Object} reportData - The diagnosis report data
 * @param {Object} patientData - Patient information
 * @param {Object} constitution - Constitution type object
 * @param {string} styleId - Style ID (modern, traditional, minimal, colorful)
 * @param {Object} content - Content selection flags
 * @returns {string} SVG markup string
 */
export const generateInfographicSvg = (reportData, patientData, constitution, styleId, content) => {
    const style = INFOGRAPHIC_STYLES[styleId] || INFOGRAPHIC_STYLES.modern;
    const sections = buildInfographicContent(reportData, patientData, constitution, content);

    const width = 400;
    let currentY = 40;
    const padding = 20;
    const sectionGap = 20;

    // Calculate dynamic height based on content
    let contentHeight = 160; // Header height
    sections.forEach(section => {
        if (section.type === 'diagnosis') {
            contentHeight += 100;
        } else if (section.type === 'dietary') {
            contentHeight += 80 + (section.beneficial?.length || 0) * 28 + (section.avoid?.length || 0) * 28;
        } else {
            contentHeight += 60 + (section.items?.length || 0) * 28;
        }
        contentHeight += sectionGap;
    });
    contentHeight += 80; // Footer

    const height = Math.max(500, contentHeight);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${style.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${style.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
        </filter>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="${style.background}"/>
    
    <!-- Header -->
    <rect x="${padding}" y="${currentY}" width="${width - padding * 2}" height="100" rx="16" fill="url(#headerGrad)"/>
    <text x="${width / 2}" y="${currentY + 45}" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="system-ui">🏥 Your TCM Summary</text>
    <text x="${width / 2}" y="${currentY + 72}" text-anchor="middle" fill="white" font-size="12" opacity="0.9" font-family="system-ui">Traditional Chinese Medicine</text>
`;

    currentY += 120;

    // Render sections
    sections.forEach(section => {
        if (section.type === 'diagnosis') {
            // Diagnosis card
            svg += `
    <rect x="${padding}" y="${currentY}" width="${width - padding * 2}" height="80" rx="12" fill="white" filter="url(#shadow)"/>
    <rect x="${padding}" y="${currentY}" width="4" height="80" fill="${style.accent}"/>
    <text x="${padding + 16}" y="${currentY + 24}" fill="${style.accent}" font-size="11" font-weight="600" font-family="system-ui">${escapeXml(section.title)}</text>
    <text x="${padding + 16}" y="${currentY + 48}" fill="${style.text}" font-size="14" font-weight="bold" font-family="system-ui">${escapeXml(section.primary)}</text>
`;
            if (section.secondary) {
                svg += `    <text x="${padding + 16}" y="${currentY + 68}" fill="#64748b" font-size="11" font-family="system-ui">${escapeXml(section.secondary)}</text>\n`;
            }
            currentY += 100;
        } else if (section.type === 'dietary') {
            // Dietary section
            svg += `    <text x="${padding + 8}" y="${currentY + 16}" fill="${style.accent}" font-size="12" font-weight="600" font-family="system-ui">${escapeXml(section.title)}</text>\n`;
            currentY += 30;

            // Beneficial foods
            section.beneficial?.forEach((food, idx) => {
                svg += `
    <rect x="${padding}" y="${currentY}" width="${width - padding * 2}" height="24" rx="6" fill="white" filter="url(#shadow)"/>
    <text x="${padding + 12}" y="${currentY + 16}" fill="#22c55e" font-size="12" font-family="system-ui">✅</text>
    <text x="${padding + 32}" y="${currentY + 16}" fill="${style.text}" font-size="11" font-family="system-ui">${escapeXml(truncate(food, 35))}</text>
`;
                currentY += 28;
            });

            // Foods to avoid
            section.avoid?.forEach((food, idx) => {
                svg += `
    <rect x="${padding}" y="${currentY}" width="${width - padding * 2}" height="24" rx="6" fill="#fef2f2" filter="url(#shadow)"/>
    <text x="${padding + 12}" y="${currentY + 16}" fill="#ef4444" font-size="12" font-family="system-ui">❌</text>
    <text x="${padding + 32}" y="${currentY + 16}" fill="#dc2626" font-size="11" font-family="system-ui">${escapeXml(truncate(food, 35))}</text>
`;
                currentY += 28;
            });
            currentY += sectionGap;
        } else {
            // Generic list section
            svg += `    <text x="${padding + 8}" y="${currentY + 16}" fill="${style.accent}" font-size="12" font-weight="600" font-family="system-ui">${escapeXml(section.title)}</text>\n`;
            currentY += 30;

            section.items?.forEach((item, idx) => {
                svg += `
    <rect x="${padding}" y="${currentY}" width="${width - padding * 2}" height="24" rx="6" fill="white" filter="url(#shadow)"/>
    <text x="${padding + 12}" y="${currentY + 16}" fill="${style.accent}" font-size="11" font-family="system-ui">${idx + 1}.</text>
    <text x="${padding + 28}" y="${currentY + 16}" fill="${style.text}" font-size="11" font-family="system-ui">${escapeXml(truncate(item, 38))}</text>
`;
                currentY += 28;
            });
            currentY += sectionGap;
        }
    });

    // Yin-Yang decorative element
    const yinYangX = width - 60;
    const yinYangY = currentY + 10;
    svg += `
    <!-- Yin-Yang -->
    <circle cx="${yinYangX}" cy="${yinYangY}" r="30" fill="white" filter="url(#shadow)"/>
    <path d="${yinYangX} ${yinYangY - 30} A30 30 0 0 1 ${yinYangX} ${yinYangY + 30} A15 15 0 0 1 ${yinYangX} ${yinYangY} A15 15 0 0 0 ${yinYangX} ${yinYangY - 30}" fill="${style.primary}"/>
    <path d="${yinYangX} ${yinYangY - 30} A30 30 0 0 0 ${yinYangX} ${yinYangY + 30} A15 15 0 0 0 ${yinYangX} ${yinYangY} A15 15 0 0 1 ${yinYangX} ${yinYangY - 30}" fill="${style.text}"/>
    <circle cx="${yinYangX}" cy="${yinYangY - 15}" r="5" fill="${style.text}"/>
    <circle cx="${yinYangX}" cy="${yinYangY + 15}" r="5" fill="${style.primary}"/>
`;

    // Footer
    currentY = height - 50;
    svg += `
    <!-- Footer -->
    <line x1="${padding}" y1="${currentY - 10}" x2="${width - padding}" y2="${currentY - 10}" stroke="#e2e8f0" stroke-width="1"/>
    <text x="${width / 2}" y="${currentY + 10}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">Generated by Sihat TCM | ${new Date().toLocaleDateString()}</text>
    <text x="${width / 2}" y="${currentY + 26}" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="system-ui">Consult a licensed practitioner for medical advice</text>
</svg>`;

    return svg;
};

export default {
    INFOGRAPHIC_STYLES,
    CONTENT_OPTIONS,
    buildInfographicContent,
    generateInfographicSvg,
};
