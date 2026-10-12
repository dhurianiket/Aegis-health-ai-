const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/components');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonTags = match[0];
    if (buttonTags.includes('disabled') && !buttonTags.includes('title=')) {
      console.log(`${file}: Disabled button without title\n${buttonTags.slice(0, 150)}...\n`);
    }
  }
});
