require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CatalogItem = require('../src/models/CatalogItem');

const artifactDir = "C:\\Users\\yashg\\.gemini\\antigravity-ide\\brain\\608f5af5-3288-4440-a70a-325af40229fd";
const targetDir = path.join(__dirname, '../../frontend/public/images/catalog');

const imagesToUpload = [
  { filePrefix: 'box_mockup_', itemId: 'box-mockups' },
  { filePrefix: 'pouch_mockup_', itemId: 'pouch-bag-mockups' },
  { filePrefix: 'bottle_mockup_', itemId: 'bottle-mockups' },
  { filePrefix: 'can_mockup_', itemId: 'can-mockups' },
  { filePrefix: 'tube_mockup_', itemId: 'tube-mockups' },
  { filePrefix: 'cup_mockup_', itemId: 'cup-container-mockups' }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kld');
    console.log('Connected to MongoDB');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(artifactDir);

    for (const mapping of imagesToUpload) {
      // Find the most recent file matching the prefix
      const matchingFiles = files.filter(f => f.startsWith(mapping.filePrefix) && f.endsWith('.jpg'));
      if (matchingFiles.length === 0) {
        console.log(`No image found for ${mapping.filePrefix}`);
        continue;
      }
      
      matchingFiles.sort();
      const latestFile = matchingFiles[matchingFiles.length - 1];
      const sourcePath = path.join(artifactDir, latestFile);
      const targetFileName = `${mapping.itemId}.jpg`;
      const targetPath = path.join(targetDir, targetFileName);
      
      console.log(`Copying ${latestFile} to ${targetPath}...`);
      fs.copyFileSync(sourcePath, targetPath);
      
      const fileUrl = `/images/catalog/${targetFileName}`;
      
      try {
        // Update database
        const updated = await CatalogItem.findOneAndUpdate(
          { itemId: mapping.itemId },
          { $set: { img: fileUrl } },
          { new: true }
        );
        
        if (updated) {
          console.log(`Updated DB for ${mapping.itemId} with ${fileUrl}`);
        } else {
          console.log(`Item ${mapping.itemId} not found in DB.`);
        }
        
      } catch (uploadErr) {
        console.error(`Failed to update ${latestFile}:`, uploadErr.message);
      }
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
