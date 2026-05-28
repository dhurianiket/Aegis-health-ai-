import { performance } from 'perf_hooks';

// Simulate non-batched writes
async function runNonBatched(n) {
  const start = performance.now();
  const promises = [];
  for (let i = 0; i < n; i++) {
    // Simulate network latency (50ms average)
    promises.push(new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 10)));
  }
  await Promise.all(promises);
  const end = performance.now();
  return end - start;
}

// Simulate batched writes (single network request)
async function runBatched(n) {
  const start = performance.now();
  // Simulate single network latency (50ms average + slightly longer payload processing)
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 10 + n * 0.5));
  const end = performance.now();
  return end - start;
}

async function run() {
  const iterations = 5;
  let nonBatchedTotal = 0;
  let batchedTotal = 0;
  const docs = 50; // number of documents

  for(let i = 0; i < iterations; i++) {
      nonBatchedTotal += await runNonBatched(docs);
      batchedTotal += await runBatched(docs);
  }

  console.log(`Simulated performance for ${docs} documents (averaged over ${iterations} iterations):`);
  console.log(`Non-batched Promise.all: ${(nonBatchedTotal/iterations).toFixed(2)}ms`);
  console.log(`Batched writeBatch.commit: ${(batchedTotal/iterations).toFixed(2)}ms`);
  console.log(`\nNote: True Firebase performance testing is not possible without network credentials.`);
}

run();
