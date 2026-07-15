// Componentes visuales compartidos: count-up, sparkline, donut, heatmap, recipe blend, hover preview
const { useState: useStateViz, useEffect: useEffectViz, useRef: useRefViz, useMemo: useMemoViz } = React;

// ── Count-up animado ──────────────────────────────────────────────
function CountUp({ value, duration = 900, format, className, style }) {
  const [disp, setDisp] = useStateViz(0);
  const rafRef = useRefViz(null);
  const fromRef = useRefViz(0);
  useEffectViz(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      setDisp(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  const out = format ? format(disp) : Math.round(disp).toLocaleString('es-CO');
  return <span className={className} style={style}>{out}</span>;
}

// ── Sparkline (línea de tendencia) ────────────────────────────────
function Sparkline({ points, width = 80, height = 24, color, fill = true }) {
  if (!points || points.length < 2) {
    return <svg width={width} height={height} className="spark"></svg>;
  }
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => [i * stepX, height - 2 - ((p - min) / range) * (height - 4)]);
  const line = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
  const c = color || 'var(--accent)';
  const last = points[points.length - 1], first = points[0];
  const trendColor = last >= first ? 'var(--good)' : 'var(--bad)';
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} className="spark" viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={area} fill={trendColor} opacity="0.08" />}
      <path d={line} fill="none" stroke={color || trendColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2" fill={color || trendColor} />
    </svg>
  );
}

// Genera serie histórica simulada determinística de stock para un item
function serieStock(item, movimientos, n = 14) {
  // reconstruye stock hacia atrás desde el actual usando movimientos del item
  const movs = (movimientos || []).filter((m) => m.item === item.id).slice(0, 30);
  let stock = item.stock;
  const serie = [stock];
  for (let i = 0; i < movs.length && serie.length < n; i++) {
    stock = stock - movs[i].cant; // revertir
    serie.push(Math.max(0, stock));
  }
  while (serie.length < n) {
    // rellenar con variación determinística suave
    const h = (item.id.charCodeAt(item.id.length - 1) + serie.length * 7) % 9;
    const base = serie[serie.length - 1];
    serie.push(Math.max(0, base + (h - 4) * Math.max(1, base * 0.03)));
  }
  return serie.reverse();
}

// ── Donut chart ───────────────────────────────────────────────────
function Donut({ data, size = 160, thickness = 26, centerLabel, centerValue }) {
  // data: [{ label, value, color }]
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fontSize="12" fill="var(--ink-3)">Sin datos</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * circ;
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            style={{ transition: 'stroke-dasharray .6s ease' }} />
        );
        offset += dash;
        return seg;
      })}
      {centerValue != null && (
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--ink)" fontFamily="var(--mono)">{centerValue}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="var(--ink-3)" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>{centerLabel}</text>
        </g>
      )}
    </svg>
  );
}

// ── Heatmap de actividad (estilo calendario) ─────────────────────
function ActivityHeatmap({ movimientos, weeks = 13 }) {
  const days = weeks * 7;
  const today = new Date(); today.setHours(0,0,0,0);
  const counts = {};
  (movimientos || []).forEach((m) => {
    const part = (m.fecha || '').split(' ')[0].split(',')[0];
    counts[part] = (counts[part] || 0) + 1;
  });
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('es-CO');
    cells.push({ date: d, key, count: counts[key] || 0 });
  }
  const max = Math.max(1, ...cells.map((c) => c.count));
  const cell = 13, gap = 3;
  const tone = (c) => {
    if (c === 0) return 'var(--bg-2)';
    const t = c / max;
    if (t < 0.25) return 'oklch(0.85 0.05 240)';
    if (t < 0.5) return 'oklch(0.72 0.09 245)';
    if (t < 0.75) return 'oklch(0.60 0.12 250)';
    return 'oklch(0.48 0.14 255)';
  };
  const w = weeks * (cell + gap);
  return (
    <svg width={w} height={7 * (cell + gap) + 18} style={{ maxWidth: '100%' }}>
      {cells.map((c, i) => {
        const col = Math.floor(i / 7), row = i % 7;
        return (
          <rect key={i} className="heat-cell" x={col * (cell + gap)} y={row * (cell + gap)}
            width={cell} height={cell} rx="2" fill={tone(c.count)}>
            <title>{c.key}: {c.count} movimiento(s)</title>
          </rect>
        );
      })}
    </svg>
  );
}

// ── Recipe Blend (bandas de color proporcionales) ────────────────
function RecipeBlend({ receta, materias, height = 16 }) {
  if (!receta || receta.length === 0) return null;
  const total = receta.reduce((a, r) => a + r.cant, 0) || 1;
  const palette = ['oklch(0.52 0.13 250)', 'oklch(0.55 0.11 210)', 'oklch(0.48 0.14 270)', 'oklch(0.60 0.10 230)', 'oklch(0.45 0.13 290)', 'oklch(0.58 0.12 195)', 'oklch(0.40 0.12 255)'];
  return (
    <div style={{ display: 'flex', height, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)' }}>
      {receta.map((r, i) => {
        const mp = materias.find((m) => m.id === r.mp);
        const pct = (r.cant / total) * 100;
        return (
          <div key={r.mp} style={{ width: pct + '%', background: palette[i % palette.length] }}
            title={`${mp?.nombre || r.mp}: ${pct.toFixed(1)}%`}></div>
        );
      })}
    </div>
  );
}

window.VIZ = { CountUp, Sparkline, serieStock, Donut, ActivityHeatmap, RecipeBlend };
