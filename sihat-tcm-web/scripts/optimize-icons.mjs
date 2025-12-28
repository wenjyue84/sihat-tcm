// Script to optimize app icons
// Run with: node scripts/optimize-icons.mjs

import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const ICON_SIZE = 180; // Standard app icon size for Apple
const FAVICON_SIZE = 32;

async function optimizeIcons() {
    const srcDir = path.join(process.cwd(), 'src', 'app');

    const targetSizes = [
        { name: 'icon.png', size: 32 },
        { name: 'apple-icon.png', size: 180 },
        { name: 'favicon.ico', size: 32 }
    ];

    // Check if the source icon exists
    const sourceIcon = path.join(srcDir, 'icon.png');

    try {
        const stats = await fs.stat(sourceIcon);
        console.log(`Source icon size: ${(stats.size / 1024).toFixed(1)}KB`);

        // Create a backup
        const backupPath = path.join(srcDir, 'icon-original.png');
        const backupExists = await fs.stat(backupPath).catch(() => null);
        if (!backupExists) {
            await fs.copyFile(sourceIcon, backupPath);
            console.log('Created backup: icon-original.png');
        }

        // Optimize icon.png (32x32 for favicon)
        const iconBuffer = await sharp(sourceIcon)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();

        await fs.writeFile(sourceIcon, iconBuffer);
        console.log(`icon.png optimized: ${(iconBuffer.length / 1024).toFixed(1)}KB`);

        // Optimize apple-icon.png (180x180)
        const appleIconPath = path.join(srcDir, 'apple-icon.png');
        const appleIconBuffer = await sharp(path.join(srcDir, 'icon-original.png'))
            .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();

        await fs.writeFile(appleIconPath, appleIconBuffer);
        console.log(`apple-icon.png optimized: ${(appleIconBuffer.length / 1024).toFixed(1)}KB`);

        console.log('\n✅ Icons optimized successfully!');
    } catch (err) {
        console.error('Error optimizing icons:', err);
        process.exit(1);
    }
}

optimizeIcons();
