const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = 'C:\\Users\\yashg\\.gemini\\antigravity-ide\\brain\\6bcca327-b446-415e-8402-ae87611da60a\\.user_uploaded\\media_1790064276141.png';
const outputDir = 'c:\\Users\\yashg\\Documents\\KLD\\frontend\\public\\images\\catalog';

const filenames = [
    'box-mockups.png', 'pouch-bag-mockups.png', 'bottle-mockups.png', 'can-mockups.png',
    'tube-mockups.png', 'cup-container-mockups.png', 'food-packaging-mockups.png', 'water-bottle-mockups.png',
    'gift-box-mockups.png', 'paper-bag-mockups.png', 'pizza-packaging-mockups.png', 'supplement-bottle-mockups.png'
];

async function splitImage() {
    try {
        const metadata = await sharp(inputImagePath).metadata();
        const { width, height } = metadata;
        
        const cols = 4;
        const rows = 3;
        const cellWidth = Math.floor(width / cols);
        const cellHeight = Math.floor(height / rows);
        
        console.log(`Original image: ${width}x${height}`);
        console.log(`Cell size: ${cellWidth}x${cellHeight}`);
        
        let index = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellWidth;
                const y = r * cellHeight;
                
                const outputPath = path.join(outputDir, filenames[index]);
                
                await sharp(inputImagePath)
                    .extract({ left: x, top: y, width: cellWidth, height: cellHeight })
                    .toFile(outputPath);
                    
                console.log(`Saved ${filenames[index]}`);
                index++;
            }
        }
        console.log('Done splitting images!');
    } catch (err) {
        console.error('Error:', err);
    }
}

splitImage();
