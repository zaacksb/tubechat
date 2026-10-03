import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

// tsc emits extensionless relative imports in .d.ts, which breaks consumers
// on moduleResolution nodenext/node16 (TS2834). Rewrite them to .js.
const files = globSync('dist/**/*.d.ts');
let fixed = 0;
for (const file of files as string[]) {
  const src = readFileSync(file, 'utf-8');
  const out = src.replace(/(from\s+['"])(\.[^'"]*?)(['"])/g, (_m, pre: string, p: string, post: string) => {
    if (/\.[a-zA-Z0-9]+$/.test(p)) return `${pre}${p}${post}`;
    fixed++;
    return `${pre}${p}.js${post}`;
  }).replace(/(import\s*\(\s*['"])(\.[^'"]*?)(['"]\s*\))/g, (_m, pre: string, p: string, post: string) => {
    if (/\.[a-zA-Z0-9]+$/.test(p)) return `${pre}${p}${post}`;
    fixed++;
    return `${pre}${p}.js${post}`;
  });
  if (out !== src) writeFileSync(file, out);
}
console.log(`fix-dts: ${fixed} imports fixed in ${files.length} files`);
