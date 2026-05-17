const fs = require('fs');
const file = 'src/components/Dashboard/Dashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace(/shadow-2xl/g, 'shadow-md dark:shadow-2xl');
fs.writeFileSync(file, txt);
