const fs = require('fs');
const path = require('path');

const files = [
  'src/math/calculusEngine.ts',
  'src/math/differentialEngine.ts',
  'src/math/laplaceEngine.ts',
  'src/math/algebraEngine.ts',
  'src/math/precalculusEngine.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if not present
  if (!content.includes('formatNumber')) {
    // Import formatNumber from formatting.ts depending on depth
    // Since these are in src/math/, path to utils is ../utils/formatting
    content = "import { formatNumber } from '../utils/formatting';\n" + content;
  }
  
  // Replace x.toFixed(n) with formatNumber(x) 
  // We can just replace .toFixed(anything) assuming we want the default 2 decimals, or pass it if necessary,
  // but the prompt asked for 2 decimals by default everywhere.
  // Regex to match variable.toFixed(number)
  content = content.replace(/(\w+(?:\.\w+)?|(?:\([^)]+\)))\.toFixed\(\d+\)/g, (match, p1) => {
    return `formatNumber(${p1})`;
  });

  fs.writeFileSync(file, content);
}
console.log("Refactoring complete");
