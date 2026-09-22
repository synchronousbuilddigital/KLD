const sharp = require('sharp');
const path = require('path');

const inputImagePath = 'C:\\Users\\yashg\\.gemini\\antigravity-ide\\brain\\6bcca327-b446-415e-8402-ae87611da60a\\.user_uploaded\\media_1790064276141.png';
const outputDir = 'c:\\Users\\yashg\\Documents\\KLD\\frontend\\public\\images\\catalog';

const items = [
    { name: 'box-mockups.png', left: 0, top: 0, width: 250, height: 230 },
    { name: 'pouch-bag-mockups.png', left: 270, top: 0, width: 210, height: 240 },
    { name: 'bottle-mockups.png', left: 520, top: 0, width: 170, height: 240 },
    { name: 'can-mockups.png', left: 740, top: 0, width: 284, height: 240 },
    
    { name: 'tube-mockups.png', left: 0, top: 250, width: 240, height: 210 },
    { name: 'cup-container-mockups.png', left: 245, top: 250, width: 250, height: 210 },
    { name: 'food-packaging-mockups.png', left: 500, top: 250, width: 280, height: 210 },
    { name: 'water-bottle-mockups.png', left: 800, top: 250, width: 200, height: 230 },
    
    { name: 'gift-box-mockups.png', left: 0, top: 480, width: 270, height: 202 },
    { name: 'paper-bag-mockups.png', left: 280, top: 480, width: 240, height: 202 },
    { name: 'pizza-packaging-mockups.png', left: 520, top: 480, width: 240, height: 202 },
    { name: 'supplement-bottle-mockups.png', left: 770, top: 480, width: 250, height: 202 }
];

async function splitImage() {
    const metadata = await sharp(inputImagePath).metadata();
    console.log(metadata.width, metadata.height);

    for (const item of items) {
        try {
            const outputPath = path.join(outputDir, item.name);
            const extW = Math.min(item.width, metadata.width - item.left - 1);
            const extH = Math.min(item.height, metadata.height - item.top - 1);
            
            // Extract the box first
            const buffer = await sharp(inputImagePath)
                .extract({ left: item.left, top: item.top, width: extW, height: extH })
                .toBuffer();
                
            // Then tightly trim the transparency/white space
            await sharp(buffer)
                .trim()
                .toFile(outputPath);
                
            console.log(`Saved accurately: ${item.name}`);
        } catch (err) {
            console.error(`Error on ${item.name}:`, err);
        }
    }
}

splitImage();
