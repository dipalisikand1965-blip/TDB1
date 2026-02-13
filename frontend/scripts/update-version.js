// Build script to update meta.json with current timestamp
// This runs during the build process to create a unique version for each deployment

const fs = require('fs');
const path = require('path');

const metaPath = path.join(__dirname, '../public/meta.json');

const buildTimestamp = Date.now().toString();
const buildTime = new Date().toISOString();

const meta = {
  version: buildTimestamp,
  buildTime: buildTime
};

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log(`✅ Updated meta.json with version: ${buildTimestamp}`);
console.log(`   Build time: ${buildTime}`);
