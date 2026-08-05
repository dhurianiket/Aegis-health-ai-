import fs from 'fs';
import path from 'path';

interface GraphNode {
  file: string;
  category: 'component' | 'service' | 'context' | 'type' | 'hook' | 'util' | 'config';
  exports: string[];
  imports: string[];
}

const SRC_DIR = path.resolve('src');
const OUTPUT_FILE = path.resolve('GRAPHIFY.md');
const LESSONS_FILE = path.resolve('LESSONS.md');

function getCategory(filePath: string): GraphNode['category'] {
  const rel = path.relative(SRC_DIR, filePath);
  if (rel.startsWith('components')) return 'component';
  if (rel.startsWith('services') || rel.startsWith('lib/firebase')) return 'service';
  if (rel.startsWith('context')) return 'context';
  if (rel.startsWith('types')) return 'type';
  if (rel.startsWith('hooks')) return 'hook';
  if (rel.startsWith('utils') || rel.startsWith('lib')) return 'util';
  return 'config';
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '__tests__') {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function parseFile(filePath: string): GraphNode {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  const category = getCategory(filePath);

  const exports: string[] = [];
  const imports: string[] = [];

  // Match export declarations
  const exportMatches = content.matchAll(/export\ (?:default\ )?(?:function|const|class|interface|type|enum)\ ([A-Za-z0-9_]+)/g);
  for (const match of exportMatches) {
    if (match[1]) exports.push(match[1]);
  }
  if (content.includes('export default') && !exports.includes('default')) {
    exports.push('default');
  }

  // Match relative import paths
  const importMatches = content.matchAll(/from\ ['"](\.\.?[^'"]+)['"]/g);
  for (const match of importMatches) {
    if (match[1]) imports.push(match[1]);
  }

  return {
    file: relativePath,
    category,
    exports: Array.from(new Set(exports)),
    imports: Array.from(new Set(imports)),
  };
}

function generateGraphifyMarkdown(nodes: GraphNode[]): string {
  const categories: Record<GraphNode['category'], GraphNode[]> = {
    component: [],
    service: [],
    context: [],
    hook: [],
    type: [],
    util: [],
    config: [],
  };

  nodes.forEach((node) => {
    categories[node.category].push(node);
  });

  let md = `# GRAPHIFY — Codebase Knowledge Graph & Dependency Sitemap\n\n`;
  md += `> Automatically generated knowledge graph for Aegis Health AI.\n`;
  md += `> Used by AI Coding Assistants for high-accuracy, low-token context retrieval.\n\n`;

  md += `## 🚀 Architecture Overview\n`;
  md += `- **Stack**: React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4 + Firebase Cloud Functions & Firestore.\n`;
  md += `- **AI Engine**: Dual Gemini SDK pipeline via \`geminiClient.ts\` with model normalization & 503 retry interceptors.\n`;
  md += `- **Routing**: Single-Page App with state-driven auth routing (\`onAuthStateChanged\`).\n\n`;

  md += `## 🌐 Module Node Index\n\n`;

  const sectionTitles: Record<GraphNode['category'], string> = {
    component: '🧩 Components',
    service: '⚙️ Services & API Providers',
    context: '🔄 React Context Providers',
    hook: '🪝 Custom Hooks',
    type: '📐 TypeScript Schemas & Types',
    util: '🛠️ Utilities & Helpers',
    config: '⚙️ Configuration',
  };

  (Object.keys(categories) as GraphNode['category'][]).forEach((cat) => {
    if (categories[cat].length === 0) return;
    md += `### ${sectionTitles[cat]}\n`;
    categories[cat].forEach((node) => {
      md += `- **[\`${node.file}\`](file:///${path.resolve(node.file)})**\n`;
      if (node.exports.length > 0) {
        md += `  - *Exports*: \`${node.exports.join('`, `')}\`\n`;
      }
      if (node.imports.length > 0) {
        md += `  - *Imports*: \`${node.imports.slice(0, 5).join('`, `')}${node.imports.length > 5 ? '...' : ''}\`\n`;
      }
    });
    md += `\n`;
  });

  md += `## 🔗 Key Data Flow Relationships\n`;
  md += `- **Auth Flow**: \`AuthContext.tsx\` -> \`firebase/config.ts\` -> \`onAuthStateChanged\` -> \`App.tsx\` -> \`Dashboard.tsx\`\n`;
  md += `- **Clinical Data Real-Time Sync**: \`useClinicalContext.ts\` -> Firestore \`users/{userId}/documents\` (\`onSnapshot\`) -> \`drugLabEngine.ts\` -> \`InteractionMatrix.tsx\`\n`;
  md += `- **AI Extraction**: \`UploadCenter.tsx\` -> Canvas compression -> \`geminiClient.ts\` -> \`promptFramework.ts\` (Zod validation) -> Firestore \`users/{userId}/documents\`\n`;
  md += `- **Specialist Chat**: \`SpecialistLounge.tsx\` -> \`sourceGroundedService.ts\` (Guideline lookup ACC/ADA/KDIGO/ESC) -> \`VirtualizedChatList.tsx\` (\`pretext\` height measurement) -> \`CitationBadge.tsx\`\n\n`;

  return md;
}

function main() {
  console.log('Graphify: Scanning codebase for AST nodes...');
  const files = scanDirectory(SRC_DIR);
  const nodes = files.map(parseFile);
  const markdown = generateGraphifyMarkdown(nodes);

  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`Graphify: Generated ${OUTPUT_FILE} (${nodes.length} nodes indexed).`);

  if (!fs.existsSync(LESSONS_FILE)) {
    const lessonsInitial = `# LESSONS — Graphify AI Reflection & Dead-End Memory\n\n` +
      `This file logs verified implementation rules, past bugs, and dead-ends to prevent repeat mistakes across AI sessions.\n\n` +
      `## Invariants & Verified Patterns\n` +
      `1. **No Next.js / No Firebase App Hosting**: Strictly React + Vite + TypeScript + Firebase Client / Functions.\n` +
      `2. **Gemini Interceptor Mandatory**: All Gemini AI calls MUST use \`geminiClient.ts\` for model normalization & 503 fallback.\n` +
      `3. **Recharts Envelope Rule**: Recharts MUST be wrapped in strict \`h-[300px]\` height envelopes.\n` +
      `4. **Real-time Firestore Sync**: Clinical data MUST use real-time \`onSnapshot\` listeners (\`useClinicalContext.ts\`).\n` +
      `5. **Lockfile Synchronization**: Always run \`npm install\` when updating \`package.json\` dependencies.\n`;
    fs.writeFileSync(LESSONS_FILE, lessonsInitial, 'utf-8');
    console.log(`Graphify: Generated ${LESSONS_FILE}.`);
  }
}

main();
