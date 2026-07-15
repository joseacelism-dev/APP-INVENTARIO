const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist', 'web');

const sourceScripts = [
  'tweaks-panel.jsx',
  'icons.jsx',
  'utils.jsx',
  'supabase-sync.jsx',
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

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://urgipxrvwjplpjbbcolk.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dGZho8NFHiuIu8uG9Kge0A_rBvaQtfg'
};
fs.writeFileSync(
  path.join(out, 'config.js'),
  `window.PINTURASTOCK_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  'utf8'
);

fs.writeFileSync(
  path.join(root, 'config.js'),
  `window.PINTURASTOCK_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  'utf8'
);

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
