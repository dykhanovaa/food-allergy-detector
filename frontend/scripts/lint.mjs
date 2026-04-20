import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const targets = ['src'];
const allowedExtensions = new Set(['.ts', '.tsx']);
const allowedFiles = new Set(['config.ts']);
const forbiddenPatterns = [
  /http:\/\/localhost:8000/g,
  /http:\/\/localhost:5173/g,
];

function collectFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (allowedExtensions.has(extname(entry.name)) && !allowedFiles.has(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const failures = [];

for (const target of targets) {
  const files = collectFiles(join(root, target));
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        failures.push(`${file}: forbidden hardcoded localhost URL matches ${pattern}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Frontend lint failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Frontend lint passed');
