// Analyze mesh code regions in population files
const fs = require('fs');
const path = require('path');

const populationDir = './population';

// Japanese mesh code to region mapping (first 2 digits)
const meshRegions = {
  // Hokkaido
  '60': 'Hokkaido (South)',
  '61': 'Hokkaido (Central)',
  '62': 'Hokkaido (North)',
  '63': 'Hokkaido (East)',
  '64': 'Hokkaido (West)',
  
  // Tohoku
  '56': 'Aomori',
  '57': 'Iwate/Akita',
  '58': 'Miyagi/Yamagata',
  '59': 'Fukushima',
  
  // Kanto
  '52': 'Ibaraki/Tochigi',
  '53': 'Gunma/Saitama/Chiba',
  '54': 'Tokyo/Kanagawa',
  '55': 'Yamanashi',
  
  // Chubu  
  '48': 'Niigata',
  '49': 'Nagano',
  '50': 'Gifu',
  '51': 'Shizuoka',
  '46': 'Aichi',
  '47': 'Toyama/Ishikawa/Fukui',
  
  // Kansai
  '44': 'Mie',
  '45': 'Shiga/Kyoto',
  '43': 'Osaka/Hyogo',
  '42': 'Nara/Wakayama',
  
  // Chugoku/Shikoku
  '40': 'Tottori/Shimane',
  '41': 'Okayama/Hiroshima',
  '38': 'Yamaguchi',
  '39': 'Tokushima/Kagawa/Ehime/Kochi',
  
  // Kyushu
  '36': 'Fukuoka/Saga',
  '37': 'Nagasaki/Kumamoto/Oita',
  '35': 'Miyazaki/Kagoshima',
  '34': 'Okinawa'
};

// Extract primary mesh codes from filenames
const files = fs.readdirSync(populationDir);
const meshCodes = files
  .filter(f => f.endsWith('.zip'))
  .map(f => f.match(/H(\d{4})/)?.[1])
  .filter(Boolean)
  .map(code => code.substring(0, 2));

// Count by region
const regionCounts = {};
meshCodes.forEach(code => {
  const region = meshRegions[code] || `Unknown (${code})`;
  regionCounts[region] = (regionCounts[region] || 0) + 1;
});

console.log('=== Geographic Coverage Analysis ===\n');
console.log(`Total files: ${files.length}`);
console.log(`Unique primary mesh codes: ${new Set(meshCodes).size}\n`);

console.log('Coverage by Region:');
Object.entries(regionCounts)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([region, count]) => {
    console.log(`  ${region}: ${count} files`);
  });

// Determine coverage
const hasHokkaido = meshCodes.some(code => ['60', '61', '62', '63', '64'].includes(code));
const hasKanto = meshCodes.some(code => ['52', '53', '54', '55'].includes(code));
const hasKansai = meshCodes.some(code => ['42', '43', '44', '45'].includes(code));

console.log('\n=== Summary ===');
console.log(`Hokkaido coverage: ${hasHokkaido ? '✅ YES' : '❌ NO'}`);
console.log(`Kanto (Tokyo area) coverage: ${hasKanto ? '✅ YES' : '❌ NO'}`);
console.log(`Kansai (Osaka area) coverage: ${hasKansai ? '✅ YES' : '❌ NO'}`);

// List specific mesh codes
const uniqueCodes = [...new Set(meshCodes)].sort();
console.log(`\nPrimary mesh codes in your data: ${uniqueCodes.join(', ')}`);