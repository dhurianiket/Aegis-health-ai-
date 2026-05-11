const fs = require('fs');

let content = fs.readFileSync('src/lib/firebase/firestore.ts', 'utf8');

// Specifically replace the collection(db, path) based on the function context.
const functionsToFix = [
  { name: 'getDocuments', col: 'documents' },
  { name: 'getLabHistory', col: 'labResults' },
  { name: 'getMedications', col: 'medications' },
  { name: 'saveLabResult', col: 'labResults' },
  { name: 'saveMedication', col: 'medications' },
  { name: 'getLatestInsights', col: 'insights' },
  { name: 'saveSpecialistInsight', col: 'insights' },
  { name: 'getHealthScores', col: 'scores' },
  { name: 'saveHealthScore', col: 'scores' },
  { name: 'getClinicalSummary', col: 'summaries' },
  { name: 'saveClinicalSummary', col: 'summaries' },
  { name: 'getConversations', col: 'conversations' },
  { name: 'saveConversation', col: 'conversations' },
  { name: 'getFamilyRelations', col: 'familyRelations' }
];

for (const fn of functionsToFix) {
  const pathRegex = new RegExp(`const path = \`users/\\$\\{userId\\}/${fn.col}\`;`, 'g');
  content = content.replace(pathRegex, `const pathString = \`users/\${userId}/${fn.col}\`;`);
  // also handle some docs deleting where path might have extra stuff
}

// Special case: `deleteDocumentRecord` has `/documents/${docId}`
content = content.replace(/const path = \`users\/\$\{userId\}\/documents\/\$\{docId\}\`;/g, 
                          'const pathString = `users/${userId}/documents/${docId}`;');

// Now globally replace `collection(db, path)` depending on `pathString`.
// Wait, we can just replace `collection(db, path)` where we know what it belongs to.
// Actually, it's safer to just replace `const path =...` to `const pathString = ...`
// Then replace `collection(db, path)` with `collection(db, "users", userId, "[col]")` for each function explicitly.

// Instead of complex Regex, I will just write out the replaces
content = content.replace(/const pathString = `users\/\$\{userId\}\/documents`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/documents`;$1collection(db, "users", userId, "documents")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/labResults`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/labResults`;$1collection(db, "users", userId, "labResults")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/medications`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/medications`;$1collection(db, "users", userId, "medications")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/insights`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/insights`;$1collection(db, "users", userId, "insights")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/scores`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/scores`;$1collection(db, "users", userId, "scores")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/summaries`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/summaries`;$1collection(db, "users", userId, "summaries")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/conversations`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/conversations`;$1collection(db, "users", userId, "conversations")');
content = content.replace(/const pathString = `users\/\$\{userId\}\/familyRelations`;([\s\S]*?)collection\(db, path\)/g, 'const pathString = `users/${userId}/familyRelations`;$1collection(db, "users", userId, "familyRelations")');

// Replace handleFirestoreError(_, _, path) with pathString
content = content.replace(/handleFirestoreError\(([^,]+),\s*([^,]+),\s*path\)/g, 'handleFirestoreError($1, $2, pathString)');

fs.writeFileSync('src/lib/firebase/firestore.ts', content);

console.log("firestore.ts successfully updated");
