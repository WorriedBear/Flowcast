// Banned-pattern scanner (Part 0.2). Scans src/ and built HTML; exits non-zero on any hit.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const RULES = [
  [/href=["']#?["']/, 'empty or "#" href'],
  [/onClick=\{\(\)\s*=>\s*\{\s*\}\}/, 'empty onClick handler'],
  [/\bTODO\b|\bFIXME\b/, 'TODO/FIXME'],
  [/\blorem\b|\bipsum\b/i, 'lorem ipsum'],
  [/coming soon|under construction/i, '"Coming soon" / "Under construction"'],
  [/console\.log\(/, 'console.log'],
  [/not implemented|out of scope/i, '"Not implemented" / "Out of scope" message'],
];
// "placeholder" is banned in user-visible text; the HTML attribute name is allowed.
const PLACEHOLDER_TEXT = />[^<]*\bplaceholder\b[^<]*</i;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx', '.html', '.css', '.mjs'].includes(extname(p))) out.push(p);
  }
  return out;
}
const files = walk('src');
if (existsSync('dist')) for (const f of readdirSync('dist')) if (f.endsWith('.html')) files.push(join('dist', f));
let hits = 0;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, name] of RULES) if (re.test(line)) { hits++; console.error(`${f}:${i + 1}  ${name}\n    ${line.trim().slice(0, 140)}`); }
    if (PLACEHOLDER_TEXT.test(line.replace(/placeholder=("[^"]*"|\{[^}]*\})/g, ""))) { hits++; console.error(`${f}:${i + 1}  "placeholder" in visible text`); }
  });
}
if (hits) { console.error(`\nqa-grep: ${hits} banned pattern(s) found.`); process.exit(1); }
process.stdout.write(`qa-grep: ${files.length} files clean.\n`);
