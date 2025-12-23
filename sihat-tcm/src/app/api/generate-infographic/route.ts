import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { prompt, style, reportData, patientInfo } = await req.json();

        // For demo purposes, we'll create a client-side generated infographic
        // In production, you could integrate with image generation APIs like:
        // - DALL-E 3
        // - Midjourney API
        // - Stable Diffusion
        // - Adobe Firefly

        // For now, we'll generate a styled HTML infographic and convert to image
        const infographicHtml = generateInfographicHTML(reportData, patientInfo, style);

        // Return the HTML which can be rendered client-side
        // In a production environment, you would use a service to render HTML to image
        // Options include: Puppeteer, html2canvas, or cloud rendering services

        return NextResponse.json({
            success: true,
            type: 'html',
            html: infographicHtml,
            // For demo, we'll use a placeholder image URL
            // Replace with actual generated image URL in production
            imageUrl: generatePlaceholderDataUrl(reportData, patientInfo, style)
        });

    } catch (error: any) {
        console.error("[API /api/generate-infographic] Error:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate infographic' },
            { status: 500 }
        );
    }
}

function generateInfographicHTML(reportData: any, patientInfo: any, style: string): string {
    const diagnosis = typeof reportData.diagnosis === 'string'
        ? reportData.diagnosis
        : reportData.diagnosis?.primary_pattern || 'TCM Health Summary';

    const constitution = typeof reportData.constitution === 'string'
        ? reportData.constitution
        : reportData.constitution?.type || '';

    const foods = reportData.recommendations?.food_therapy?.beneficial?.slice(0, 6)
        || reportData.recommendations?.food?.slice(0, 6)
        || [];

    const avoid = reportData.recommendations?.food_therapy?.avoid?.slice(0, 4)
        || reportData.recommendations?.avoid?.slice(0, 4)
        || [];

    const lifestyle = reportData.recommendations?.lifestyle?.slice(0, 4) || [];

    const styleConfig: Record<string, { bg: string; accent: string; text: string; gradient: string }> = {
        modern: {
            bg: '#f8fafc',
            accent: '#10b981',
            text: '#1e293b',
            gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
        },
        traditional: {
            bg: '#fef3c7',
            accent: '#dc2626',
            text: '#1c1917',
            gradient: 'linear-gradient(135deg, #dc2626 0%, #9333ea 100%)'
        },
        minimal: {
            bg: '#ffffff',
            accent: '#374151',
            text: '#1f2937',
            gradient: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)'
        },
        colorful: {
            bg: '#fdf4ff',
            accent: '#8b5cf6',
            text: '#18181b',
            gradient: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #06b6d4 100%)'
        }
    };

    const config = styleConfig[style] || styleConfig.modern;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        .infographic {
            width: 800px;
            background: ${config.bg};
            padding: 40px;
        }
        .header {
            background: ${config.gradient};
            padding: 30px;
            border-radius: 20px;
            color: white;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; }
        .section { margin-bottom: 25px; }
        .section-title {
            color: ${config.accent};
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .diagnosis-card {
            background: white;
            padding: 20px;
            border-radius: 15px;
            border-left: 4px solid ${config.accent};
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .food-item {
            background: white;
            padding: 12px 16px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .food-icon { font-size: 20px; }
        .avoid-item { background: #fef2f2; color: #dc2626; }
        .lifestyle-item {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 10px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="infographic">
        <div class="header">
            <h1>🏥 Your TCM Health Summary</h1>
            <p>Traditional Chinese Medicine Diagnosis Report</p>
        </div>
        
        <div class="section">
            <div class="section-title">📋 Diagnosis</div>
            <div class="diagnosis-card">
                <h3 style="font-size: 20px; margin-bottom: 8px; color: ${config.text};">${diagnosis}</h3>
                ${constitution ? `<p style="color: #64748b;">Constitution: ${constitution}</p>` : ''}
            </div>
        </div>

        ${foods.length > 0 ? `
        <div class="section">
            <div class="section-title">🥗 Recommended Foods</div>
            <div class="grid">
                ${foods.map((food: string) => `
                    <div class="food-item">
                        <span class="food-icon">✅</span>
                        <span>${food}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${avoid.length > 0 ? `
        <div class="section">
            <div class="section-title">🚫 Foods to Avoid</div>
            <div class="grid">
                ${avoid.map((food: string) => `
                    <div class="food-item avoid-item">
                        <span class="food-icon">❌</span>
                        <span>${food}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${lifestyle.length > 0 ? `
        <div class="section">
            <div class="section-title">🌿 Lifestyle Tips</div>
            ${lifestyle.map((tip: string, idx: number) => `
                <div class="lifestyle-item">
                    <strong>${idx + 1}.</strong> ${tip}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by Sihat TCM AI Assistant | ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 5px;">Consult a licensed TCM practitioner for personalized advice.</p>
        </div>
    </div>
</body>
</html>`;
}

function generatePlaceholderDataUrl(reportData: any, patientInfo: any, style: string): string {
    // Create a simple SVG infographic as a placeholder
    const diagnosis = typeof reportData.diagnosis === 'string'
        ? reportData.diagnosis
        : reportData.diagnosis?.primary_pattern || 'TCM Diagnosis';

    const constitution = typeof reportData.constitution === 'string'
        ? reportData.constitution
        : reportData.constitution?.type || 'Not specified';

    const foods = reportData.recommendations?.food_therapy?.beneficial?.slice(0, 3)
        || reportData.recommendations?.food?.slice(0, 3)
        || ['Balanced diet recommended'];

    const styleColors: Record<string, { primary: string; secondary: string; bg: string; text: string }> = {
        modern: { primary: '#10b981', secondary: '#3b82f6', bg: '#f8fafc', text: '#1e293b' },
        traditional: { primary: '#dc2626', secondary: '#9333ea', bg: '#fef3c7', text: '#1c1917' },
        minimal: { primary: '#374151', secondary: '#6b7280', bg: '#ffffff', text: '#1f2937' },
        colorful: { primary: '#8b5cf6', secondary: '#f43f5e', bg: '#fdf4ff', text: '#18181b' }
    };

    const colors = styleColors[style] || styleColors.modern;

    // Escape special characters for SVG
    const escapeXml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1"/>
        </filter>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="1000" fill="${colors.bg}"/>
    
    <!-- Header -->
    <rect x="40" y="40" width="720" height="140" rx="20" fill="url(#headerGrad)"/>
    <text x="400" y="100" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="system-ui">🏥 Your TCM Health Summary</text>
    <text x="400" y="135" text-anchor="middle" fill="white" font-size="16" opacity="0.9" font-family="system-ui">Traditional Chinese Medicine Diagnosis</text>
    
    <!-- Diagnosis Card -->
    <rect x="40" y="210" width="720" height="130" rx="15" fill="white" filter="url(#shadow)"/>
    <rect x="40" y="210" width="6" height="130" fill="${colors.primary}"/>
    <text x="70" y="250" fill="${colors.primary}" font-size="14" font-weight="600" font-family="system-ui">📋 DIAGNOSIS</text>
    <text x="70" y="285" fill="${colors.text}" font-size="22" font-weight="bold" font-family="system-ui">${escapeXml(diagnosis.substring(0, 50))}${diagnosis.length > 50 ? '...' : ''}</text>
    <text x="70" y="315" fill="#64748b" font-size="14" font-family="system-ui">Constitution: ${escapeXml(constitution)}</text>
    
    <!-- Foods Section -->
    <text x="60" y="390" fill="${colors.primary}" font-size="16" font-weight="600" font-family="system-ui">🥗 Recommended Foods</text>
    ${foods.map((food: string, idx: number) => `
        <rect x="40" y="${410 + idx * 60}" width="340" height="50" rx="10" fill="white" filter="url(#shadow)"/>
        <text x="60" y="${443 + idx * 60}" fill="#22c55e" font-size="18" font-family="system-ui">✅</text>
        <text x="90" y="${443 + idx * 60}" fill="${colors.text}" font-size="14" font-family="system-ui">${escapeXml(String(food).substring(0, 35))}</text>
    `).join('')}
    
    <!-- Yin Yang Symbol -->
    <circle cx="600" cy="500" r="80" fill="white" filter="url(#shadow)"/>
    <path d="M600 420 A80 80 0 0 1 600 580 A40 40 0 0 1 600 500 A40 40 0 0 0 600 420" fill="${colors.primary}"/>
    <path d="M600 420 A80 80 0 0 0 600 580 A40 40 0 0 0 600 500 A40 40 0 0 1 600 420" fill="${colors.text}"/>
    <circle cx="600" cy="460" r="12" fill="${colors.text}"/>
    <circle cx="600" cy="540" r="12" fill="${colors.primary}"/>
    
    <!-- Footer -->
    <line x1="40" y1="920" x2="760" y2="920" stroke="#e2e8f0" stroke-width="1"/>
    <text x="400" y="950" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Generated by Sihat TCM AI Assistant | ${new Date().toLocaleDateString()}</text>
    <text x="400" y="970" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="system-ui">Consult a licensed TCM practitioner for personalized advice</text>
</svg>`;

    // Convert SVG to data URL
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}
