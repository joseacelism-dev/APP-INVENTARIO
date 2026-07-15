const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist', 'web');

const sourceScripts = [
  'tweaks-panel.jsx',
  'icons.jsx',
  'utils.jsx',
  'modules/viz.jsx',
  'shared.jsx',
  'modules/dashboard.jsx',
  'modules/materias.jsx',
  'modules/productos.jsx',
  'modules/produccion.jsx',
  'modules/reportes.jsx',
  'modules/usuarios.jsx',
  'modules/basedatos.jsx',
  'modules/movimientos.jsx',
  'modules/diseno.jsx',
  'modules/logica.jsx',
  'modules/login.jsx',
  'modules/proveedores.jsx',
  'modules/categorias.jsx',
  'modules/compras.jsx',
  'modules/auditoria.jsx',
  'modules/shell-extras.jsx',
  'app.jsx'
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const dir of ['assets', 'vendor']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
}
fs.rmSync(path.join(out, 'vendor', 'babel.min.js'), { force: true });

for (const file of sourceScripts) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const target = path.join(out, file.replace(/\.jsx$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const transformed = Babel.transform(source, {
    presets: ['react'],
    filename: file,
    compact: false
  }).code;
  fs.writeFileSync(target, `${transformed}\n`, 'utf8');
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\r?\n?/g, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\r?\n?/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^"]+" rel="stylesheet" \/>\r?\n?/g, '')
  .replace(/\s*<script src="vendor\/babel\.min\.js"><\/script>\r?\n?/g, '\n')
  .replace(/<script type="text\/babel" src="([^"]+)\.jsx"><\/script>/g, '<script src="$1.js"></script>');

fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(out, '.nojekyll'), '', 'utf8');
console.log(`Production web build written to ${out}`);
