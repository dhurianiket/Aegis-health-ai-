import https from 'https';
import fs from 'fs';
import path from 'path';
import { MeshoptSimplifier } from 'meshoptimizer';
import * as THREE from 'three';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseGLB(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen + 8;
  const bin = buf.subarray(binOffset);
  return { json, bin };
}

function getAccessorTypedArray(json, bin, accessorIdx) {
  const acc = json.accessors[accessorIdx];
  const bv = json.bufferViews[acc.bufferView];
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const numComponents =
    acc.type === 'SCALAR' ? 1 : acc.type === 'VEC2' ? 2 : acc.type === 'VEC3' ? 3 : 4;
  const length = acc.count * numComponents;

  const slice = bin.subarray(byteOffset, byteOffset + length * 4);
  const ab = new ArrayBuffer(slice.byteLength);
  new Uint8Array(ab).set(slice);

  if (acc.componentType === 5126) return new Float32Array(ab, 0, length);
  if (acc.componentType === 5125) return new Uint32Array(ab, 0, length);
  if (acc.componentType === 5123) return new Uint16Array(ab, 0, length);
  throw new Error(`Unsupported componentType: ${acc.componentType}`);
}

function extractCombinedMesh(json, bin, filterFn) {
  const positionsList = [];
  const indicesList = [];
  let vertexOffset = 0;

  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    if (filterFn && !filterFn(node.name)) continue;

    const mesh = json.meshes[node.mesh];
    for (const prim of mesh.primitives) {
      const pos = getAccessorTypedArray(json, bin, prim.attributes.POSITION);
      const idx = getAccessorTypedArray(json, bin, prim.indices);

      positionsList.push(pos);
      const shiftedIdx = new Uint32Array(idx.length);
      for (let i = 0; i < idx.length; i++) {
        shiftedIdx[i] = idx[i] + vertexOffset;
      }
      indicesList.push(shiftedIdx);
      vertexOffset += pos.length / 3;
    }
  }

  const totalPosLen = positionsList.reduce((acc, a) => acc + a.length, 0);
  const totalIdxLen = indicesList.reduce((acc, a) => acc + a.length, 0);

  const combinedPos = new Float32Array(totalPosLen);
  let pOff = 0;
  for (const p of positionsList) {
    combinedPos.set(p, pOff);
    pOff += p.length;
  }

  const combinedIdx = new Uint32Array(totalIdxLen);
  let iOff = 0;
  for (const ix of indicesList) {
    combinedIdx.set(ix, iOff);
    iOff += ix.length;
  }

  return { positions: combinedPos, indices: combinedIdx };
}

function weldVertices(positions, indices, precision = 1e5) {
  const vertMap = new Map();
  const uniquePos = [];
  const remap = new Uint32Array(positions.length / 3);
  let uniqueCount = 0;

  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const key = `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;
    let idx = vertMap.get(key);
    if (idx === undefined) {
      idx = uniqueCount++;
      vertMap.set(key, idx);
      uniquePos.push(x, y, z);
    }
    remap[i] = idx;
  }

  const weldedIndices = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) {
    weldedIndices[i] = remap[indices[i]];
  }

  return {
    positions: new Float32Array(uniquePos),
    indices: weldedIndices,
  };
}

function simplifyAndCompact(rawPositions, rawIndices, targetTris, targetError = 0.05) {
  const { positions, indices } = weldVertices(rawPositions, rawIndices);
  const targetIndexCount = Math.min(indices.length, targetTris * 3);
  const [simplifiedIdx] = MeshoptSimplifier.simplify(
    indices,
    positions,
    3,
    targetIndexCount,
    targetError
  );

  // Compact used vertices
  const usedMap = new Int32Array(positions.length / 3).fill(-1);
  let newVertCount = 0;
  const finalIndices = new Uint32Array(simplifiedIdx.length);

  for (let i = 0; i < simplifiedIdx.length; i++) {
    const oldV = simplifiedIdx[i];
    let newV = usedMap[oldV];
    if (newV === -1) {
      newV = newVertCount++;
      usedMap[oldV] = newV;
    }
    finalIndices[i] = newV;
  }

  const finalPositions = new Float32Array(newVertCount * 3);
  for (let oldV = 0; oldV < usedMap.length; oldV++) {
    const newV = usedMap[oldV];
    if (newV !== -1) {
      finalPositions[newV * 3] = Math.fround(positions[oldV * 3]);
      finalPositions[newV * 3 + 1] = Math.fround(positions[oldV * 3 + 1]);
      finalPositions[newV * 3 + 2] = Math.fround(positions[oldV * 3 + 2]);
    }
  }

  // Compute smooth vertex normals via Three.js BufferGeometry
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));
  geo.setIndex(new THREE.BufferAttribute(finalIndices, 1));
  geo.computeVertexNormals();
  const finalNormals = geo.attributes.normal.array;

  return {
    positions: finalPositions,
    normals: new Float32Array(finalNormals),
    indices: newVertCount < 65535 ? new Uint16Array(finalIndices) : finalIndices,
    vertCount: newVertCount,
    triCount: finalIndices.length / 3,
  };
}

function buildCombinedGLB(namedMeshes) {
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  const binChunks = [];
  let byteOffset = 0;

  function appendBuffer(typedArray, target) {
    const u8 = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const pad = (4 - (u8.byteLength % 4)) % 4;
    binChunks.push(Buffer.from(u8));
    if (pad > 0) binChunks.push(Buffer.alloc(pad));

    const bvIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: u8.byteLength,
      target,
    });
    byteOffset += u8.byteLength + pad;
    return bvIndex;
  }

  namedMeshes.forEach((m, idx) => {
    // Compute min/max for POSITION accessor (required by glTF 2.0 spec)
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < m.vertCount; i++) {
      const x = m.positions[i * 3];
      const y = m.positions[i * 3 + 1];
      const z = m.positions[i * 3 + 2];
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }

    const posBv = appendBuffer(m.positions, 34962);
    const normBv = appendBuffer(m.normals, 34962);
    const idxBv = appendBuffer(m.indices, 34963);

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posBv,
      componentType: 5126,
      count: m.vertCount,
      type: 'VEC3',
      min,
      max,
    });

    const normAcc = accessors.length;
    accessors.push({
      bufferView: normBv,
      componentType: 5126,
      count: m.vertCount,
      type: 'VEC3',
    });

    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxBv,
      componentType: m.indices instanceof Uint16Array ? 5123 : 5125,
      count: m.indices.length,
      type: 'SCALAR',
    });

    meshes.push({
      name: m.name,
      primitives: [
        {
          attributes: { POSITION: posAcc, NORMAL: normAcc },
          indices: idxAcc,
          mode: 4,
        },
      ],
    });

    nodes.push({
      name: m.name,
      mesh: idx,
    });
  });

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'Aegis Health AI - NIH Human Reference Atlas Visible Human GLB Builder (CC BY 4.0)',
    },
    scene: 0,
    scenes: [{ name: 'NIH_Visible_Human_Anatomy', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonPad = (4 - (Buffer.byteLength(jsonStr, 'utf8') % 4)) % 4;
  const jsonBuf = Buffer.concat([
    Buffer.from(jsonStr, 'utf8'),
    Buffer.alloc(jsonPad, 0x20),
  ]);

  const binBuf = Buffer.concat(binChunks);
  const totalLength = 12 + 8 + jsonBuf.byteLength + 8 + binBuf.byteLength;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.byteLength, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuf.byteLength, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);
}

async function main() {
  await MeshoptSimplifier.ready;

  const sources = [
    {
      name: 'body_shell',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/skin-male/v1.4/assets/3d-vh-m-skin.glb',
      targetTris: 18000,
      filter: null,
    },
    {
      name: 'heart',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/v1.3/assets/3d-vh-m-heart.glb',
      targetTris: 4000,
      filter: (n) =>
        n.includes('atrium') || n.includes('ventricle') || n.includes('aortic') || n.includes('pulmonary'),
    },
    {
      name: 'lungs',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/lung-male/v1.4/assets/3d-vh-m-lung.glb',
      targetTris: 6500,
      filter: (n) => n.includes('segment') || (n.includes('bronchus') && !n.includes('cartilage')),
    },
    {
      name: 'liver',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/liver-male/v1.2/assets/3d-vh-m-liver.glb',
      targetTris: 3500,
      filter: (n) => n === 'VH_M_liver_capsule' || n === 'VH_M_bare_area_of_liver',
    },
    {
      name: 'pancreas',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/pancreas-male/v1.3/assets/3d-vh-m-pancreas.glb',
      targetTris: 2000,
      filter: null,
    },
    {
      name: 'kidney_left',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/kidney-male-left/v1.3/assets/3d-vh-m-kidney-l.glb',
      targetTris: 1800,
      filter: (n) => n === 'VH_M_kidney_capsule_L' || n === 'VH_M_hilum_of_kidney_L',
    },
    {
      name: 'kidney_right',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/kidney-male-right/v1.3/assets/3d-vh-m-kidney-r.glb',
      targetTris: 1800,
      filter: (n) => n === 'VH_M_kidney_capsule_R' || n === 'VH_M_hilum_of_kidney_R',
    },
    {
      name: 'vasculature',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/blood-vasculature-male/v1.3/assets/3d-vh-m-blood-vasculature.glb',
      targetTris: 5000,
      filter: (n) =>
        n.includes('aorta') ||
        n.includes('aortic_arch') ||
        n.includes('vena_cava') ||
        n.includes('iliac') ||
        n.includes('renal_artery') ||
        n.includes('renal_vein') ||
        n.includes('pulmonary_trunk') ||
        n.includes('pulmonary_artery') ||
        n.includes('carotid') ||
        n.includes('subclavian') ||
        n.includes('brachiocephalic') ||
        n.includes('celiac') ||
        n.includes('splenic') ||
        n.includes('hepatic'),
    },
  ];

  const processed = [];
  for (const src of sources) {
    console.log(`Downloading ${src.name}...`);
    const buf = await fetchBuffer(src.url);
    const { json, bin } = parseGLB(buf);
    const raw = extractCombinedMesh(json, bin, src.filter);
    console.log(
      `  Raw ${src.name}: ${raw.positions.length / 3} verts, ${raw.indices.length / 3} tris`
    );
    const decimated = simplifyAndCompact(raw.positions, raw.indices, src.targetTris, 0.25);
    console.log(
      `  Simplified ${src.name}: ${decimated.vertCount} verts, ${decimated.triCount} tris`
    );
    processed.push({ name: src.name, ...decimated });
  }

  const outDir = path.resolve('public/models');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'nih-human-anatomy.glb');
  const glbBuf = buildCombinedGLB(processed);
  fs.writeFileSync(outPath, glbBuf);
  console.log(`\nWrote ${outPath} (${(glbBuf.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
