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
    } else if (file.endsWith('.tsx')) {
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
    const innerHtml = match[1];
    if (buttonTags.includes('aria-label') || buttonTags.includes('aria-labelledby')) continue;

    // Check if inner text is likely just an icon
    const strippedInner = innerHtml.replace(/<[^>]+>/g, '').trim();
    if (strippedInner === '') {
      console.log(`${file}: Possible icon-only button without aria-label\n${buttonTags}\n`);
    }
  }
});
