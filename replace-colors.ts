import * as fs from 'fs';

const filePath = 'src/components/Medications/Medications.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replacements:
// First, protect button text-white by changing it temporarily
content = content.replace(/bg-indigo-600([^]+?)text-white/g, 'bg-indigo-600$1TEXT_WHITE_SAFE');
content = content.replace(/bg-red-500([^]+?)text-white/g, 'bg-red-500$1TEXT_WHITE_SAFE');
// also some alert text-white? "AlertCircle className=\"w-6 h-6 text-white\"" -> "AlertCircle className=\"w-6 h-6 text-theme\"" is fine.

content = content.replace(/\btext-white\b/g, 'text-theme');
content = content.replace(/TEXT_WHITE_SAFE/g, 'text-white');

content = content.replace(/\btext-slate-400\b/g, 'text-muted');
content = content.replace(/text-slate-300/g, 'text-muted');
content = content.replace(/text-slate-500/g, 'text-faint');

content = content.replace(/bg-slate-900\/50/g, 'bg-surface');
content = content.replace(/border-white\/10/g, 'border-surface');
content = content.replace(/bg-white\/5/g, 'bg-surface');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-[var(--color-border)]');

content = content.replace(/placeholder-slate-500/g, 'placeholder-[var(--color-text-faint)]');

// Undo some text-theme dark mode specific
content = content.replace(/text-slate-900 dark:text-theme/g, 'text-theme');

fs.writeFileSync(filePath, content);
console.log("Colors replaced!");
