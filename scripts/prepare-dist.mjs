import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
const assets = (await readdir(new URL('../dist/assets/', import.meta.url))).filter(name => /\.(?:js|css)$/.test(name)).map(name => `/assets/${name}`);
await writeFile(new URL('../dist/asset-manifest.json', import.meta.url), JSON.stringify(assets));

const workerPath = new URL('../dist/sw.js', import.meta.url);
const worker = await readFile(workerPath, 'utf8');
const revision = createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,12);
await writeFile(workerPath, worker.replace('discuss-stash-v3', `discuss-stash-${revision}`));
