// Utilidades compartidas
// - Conversión de unidades
// - Exportación CSV / XLSX-like
// - Análisis ABC
// - Predicción de quiebres
// - Generación de códigos QR (algoritmo simple) y código de barras

// ── Conversión de unidades ────────────────────────────────────────
const UNIT_BASE = {
  kg: { base: 'g',  factor: 1000 },
  g:  { base: 'g',  factor: 1 },
  L:  { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  u:  { base: 'u',  factor: 1 }
};
function toBase(qty, unit) {
  const u = UNIT_BASE[unit];
  return u ? qty * u.factor : qty;
}
function fromBase(qty, unit) {
  const u = UNIT_BASE[unit];
  return u ? qty / u.factor : qty;
}
function smartFormat(qty, unit) {
  if (!unit) return qty.toLocaleString('es-CO');
  // For kg/L, if < 1 show in g/ml
  if (unit === 'kg' && qty < 1 && qty > 0) return (qty * 1000).toFixed(0) + ' g';
  if (unit === 'L'  && qty < 1 && qty > 0) return (qty * 1000).toFixed(0) + ' ml';
  if (unit === 'g'  && qty >= 1000) return (qty / 1000).toFixed(2) + ' kg';
  if (unit === 'ml' && qty >= 1000) return (qty / 1000).toFixed(2) + ' L';
  return Number(qty).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' ' + unit;
}

function escapeHTML(value) {
  if (value == null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ── Exportación CSV ───────────────────────────────────────────────
function exportCSV(filename, rows, headers) {
  if (!rows || rows.length === 0) { alert('No hay datos para exportar'); return; }
  const cols = headers || Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replaceAll('"','""') + '"';
    return s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ── XLSX-like: usa formato Excel-friendly TSV con extensión .xls que abre en Excel ──
function exportXLS(filename, rows, headers) {
  if (!rows || rows.length === 0) { alert('No hay datos para exportar'); return; }
  const cols = headers || Object.keys(rows[0]);
  // Use HTML table — Excel reads this fine and preserves column types
  let html = '<?xml version="1.0"?><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"/><style>table{border-collapse:collapse;font-family:Arial,sans-serif}th{background:#F3EFE7;border:1px solid #ccc;padding:6px 10px;text-align:left}td{border:1px solid #ddd;padding:5px 10px}</style></head><body>';
  html += '<table><thead><tr>' + cols.map((c) => `<th>${escapeHTML(c)}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach((r) => {
    html += '<tr>' + cols.map((c) => {
      const v = r[c];
      return `<td>${escapeHTML(v)}</td>`;
    }).join('') + '</tr>';
  });
  html += '</tbody></table></body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename.endsWith('.xls') ? filename : filename + '.xls';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ── Análisis ABC ──────────────────────────────────────────────────
// Toma una lista con {valor: number, ...} y la clasifica A (80%), B (15%), C (5%)
function clasificarABC(items, getValor) {
  const total = items.reduce((a, x) => a + getValor(x), 0);
  if (total === 0) return items.map((x) => ({ ...x, _valor: 0, _pct: 0, _acum: 0, _clase: 'C' }));
  const ordenados = [...items].sort((a, b) => getValor(b) - getValor(a));
  let acum = 0;
  return ordenados.map((x) => {
    const v = getValor(x);
    const pct = v / total * 100;
    acum += pct;
    const clase = acum <= 80 ? 'A' : acum <= 95 ? 'B' : 'C';
    return { ...x, _valor: v, _pct: pct, _acum: acum, _clase: clase };
  });
}

// ── Predicción de quiebres ────────────────────────────────────────
// Para cada MP, calcula el consumo promedio diario en los últimos N días y
// estima en cuántos días se agotará el stock actual.
function predecirQuiebres(materias, movimientos, dias = 30) {
  const ahora = Date.now();
  const limite = ahora - dias * 24 * 3600 * 1000;
  return materias.map((m) => {
    const consumos = movimientos.filter((mv) => {
      if (mv.item !== m.id || mv.cant >= 0) return false;
      const ts = Date.parse(mv.fecha) || ahora;
      return ts >= limite;
    });
    const total = consumos.reduce((a, mv) => a + Math.abs(mv.cant), 0);
    const consumoDiario = total / dias;
    const diasRestantes = consumoDiario > 0 ? m.stock / consumoDiario : Infinity;
    return { ...m, consumoDiario, diasRestantes, consumoTotal: total };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes);
}

// ── Bitácora de auditoría ────────────────────────────────────────
function logAuditoria(setData, accion, detalle, user = 'gerente', meta = {}) {
  const now = new Date();
  setData((d) => ({
    ...d,
    bitacora: [{
      fecha: now.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      fechaISO: now.toISOString(),
      ts: now.getTime(),
      accion, detalle, user,
      modulo: meta.modulo || '',
      entidad: meta.entidad || '',
      usuarioRol: meta.usuarioRol || '',
      antes: meta.antes || null,
      despues: meta.despues || null,
      ip: meta.ip || 'frontend'
    }, ...(d.bitacora || [])].slice(0, 500) // límite anti-bloat
  }));
}

// ── Histórico de precios ──────────────────────────────────────────
function logPrecio(setData, item, tipo, valorAnterior, valorNuevo, user = 'gerente') {
  if (valorAnterior === valorNuevo) return;
  setData((d) => ({
    ...d,
    preciosHistorico: [{
      fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      ts: Date.now(),
      item, tipo, valorAnterior, valorNuevo, user
    }, ...(d.preciosHistorico || [])].slice(0, 500)
  }));
}

// ── QR Code simple (estilo, no funcional real) ────────────────────
// Renderiza un patrón pseudo-aleatorio determinístico basado en el texto.
// Para uso real se necesitaría una librería; esto sirve como representación visual.
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function QRCodeSVG({ value, size = 120, margin = 8 }) {
  const cells = 21;
  const cellSize = (size - 2 * margin) / cells;
  const h = hashCode(value);
  // Generate pseudo-random pattern
  const cellsArr = [];
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      // corner finder patterns
      const inFinder = (x < 7 && y < 7) || (x > cells - 8 && y < 7) || (x < 7 && y > cells - 8);
      if (inFinder) {
        const fx = x < 7 ? x : x - (cells - 7);
        const fy = y < 7 ? y : y - (cells - 7);
        const inner = (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
        if (inner) cellsArr.push({ x, y });
      } else {
        const seed = (h ^ (x * 31 + y * 17)) >>> 0;
        if (seed % 100 < 47) cellsArr.push({ x, y });
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', borderRadius: 4 }}>
      <rect width={size} height={size} fill="#fff" />
      {cellsArr.map((c, i) => (
        <rect key={i} x={margin + c.x * cellSize} y={margin + c.y * cellSize} width={cellSize} height={cellSize} fill="#1c1a16" />
      ))}
    </svg>
  );
}

// ── Código de barras Code 128-like (visual) ───────────────────────
function BarcodeSVG({ value, width = 200, height = 50 }) {
  const h = hashCode(value);
  const bars = [];
  let x = 4;
  const total = 60;
  for (let i = 0; i < total && x < width - 4; i++) {
    const seed = (h ^ (i * 47)) >>> 0;
    const w = 1 + (seed % 4);
    const isBar = (seed % 3) !== 0;
    if (isBar) bars.push({ x, w });
    x += w + 1;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: '#fff' }}>
      {bars.map((b, i) => <rect key={i} x={b.x} y={4} width={b.w} height={height - 18} fill="#1c1a16" />)}
      <text x={width / 2} y={height - 3} fontSize="10" fontFamily="ui-monospace, monospace" fill="#1c1a16" textAnchor="middle">{value}</text>
    </svg>
  );
}

window.UT = {
  // unidades
  toBase, fromBase, smartFormat,
  // export
  exportCSV, exportXLS,
  // análisis
  clasificarABC, predecirQuiebres,
  // log
  logAuditoria, logPrecio,
  // visuales
  QRCodeSVG, BarcodeSVG,
  // seguridad
  escapeHTML
};
