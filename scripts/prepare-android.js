const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist', 'web');
const out = path.join(root, 'www');

if (!fs.existsSync(source)) {
  throw new Error('Missing dist/web. Run npm run build:web first.');
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(source, out, { recursive: true });

console.log(`Android web assets prepared in ${out}`);
