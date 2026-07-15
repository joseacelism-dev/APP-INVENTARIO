// Search palette (⌘K) + Notifications panel — shell components
const { useState: useStateShell, useEffect: useEffectShell, useRef: useRefShell, useMemo: useMemoShell } = React;

// ── Search palette (⌘K) ─────────────────────────────────────────
function SearchPalette({ data, goTo, onClose, open }) {
  const [q, setQ] = useStateShell('');
  const [idx, setIdx] = useStateShell(0);
  const inputRef = useRefShell(null);

  useEffectShell(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQ(''); setIdx(0);
    }
  }, [open]);

  const allItems = useMemoShell(() => {
    if (!data) return [];
    const items = [];
    data.materias.forEach((m) => items.push({ kind: 'MP', id: m.id, title: m.nombre, sub: `${m.categoria} · stock ${m.stock} ${m.unidad}`, page: 'materias', icon: 'materia' }));
    data.productos.forEach((p) => items.push({ kind: 'PT', id: p.id, title: p.nombre, sub: `${p.presentacion} · stock ${p.stock}`, page: 'productos', icon: 'producto', swatch: p.color }));
    data.ordenes.forEach((o) => items.push({ kind: 'OP', id: o.id, title: 'Orden de producción', sub: `${o.producto} · ${o.cantidad} u · ${o.estado}`, page: 'produccion', icon: 'produccion' }));
    (data.lotes || []).forEach((l) => items.push({ kind: 'LT', id: l.id, title: 'Lote ' + l.id, sub: `${l.producto} · ${l.cantidad} u · ${l.fecha}`, page: 'produccion', icon: 'box' }));
    (data.proveedores || []).forEach((p) => items.push({ kind: 'PRV', id: p.id, title: p.nombre, sub: p.producto || 'Proveedor', page: 'proveedores', icon: 'usuarios' }));
    (data.ordenesCompra || []).forEach((o) => items.push({ kind: 'OC', id: o.id, title: 'Orden de compra', sub: `${o.proveedorNombre} · ${o.estado}`, page: 'compras', icon: 'arrowDn' }));
    // Pages
    [
      { label: 'Dashboard', page: 'dashboard', icon: 'dashboard' },
      { label: 'Reportes',  page: 'reportes',  icon: 'reportes' },
      { label: 'Movimientos', page: 'movimientos', icon: 'arrowR' },
      { label: 'Categorías', page: 'categorias', icon: 'materia' },
      { label: 'Auditoría', page: 'auditoria', icon: 'check' }
    ].forEach((p) => items.push({ kind: 'NAV', id: p.page, title: p.label, sub: 'Ir a módulo', page: p.page, icon: p.icon, nav: true }));
    return items;
  }, [data]);

  const results = useMemoShell(() => {
    if (!q.trim()) return allItems.slice(0, 12);
    const lower = q.toLowerCase();
    return allItems.filter((it) => `${it.id} ${it.title} ${it.sub}`.toLowerCase().includes(lower)).slice(0, 30);
  }, [q, allItems]);

  useEffectShell(() => { if (idx >= results.length) setIdx(Math.max(0, results.length - 1)); }, [results.length]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const r = results[idx]; if (r) { goTo(r.page); onClose(); } }
    else if (e.key === 'Escape') { onClose(); }
  };

  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', zIndex: 80, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: 'min(620px, 92vw)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--line)' }} onKeyDown={onKey}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--ink-3)' }} />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            placeholder="Buscar materias primas, productos, órdenes, lotes…"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 15, color: 'var(--ink)' }} />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin resultados para "{q}"</div>
          ) : results.map((r, i) => (
            <div key={r.kind + r.id} onClick={() => { goTo(r.page); onClose(); }} onMouseEnter={() => setIdx(i)}
              style={{
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                background: idx === i ? 'var(--bg-2)' : 'transparent',
                borderLeft: idx === i ? '2px solid var(--accent)' : '2px solid transparent'
              }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: r.swatch || 'var(--bg-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', flexShrink: 0 }}>
                {!r.swatch && <Icon name={r.icon} size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                <div className="muted" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
              </div>
              {r.nav ? null : <span className="pill" style={{ fontSize: 10 }}>{r.kind}</span>}
              <span className="num muted" style={{ fontSize: 11 }}>{r.id}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)' }}>
          <span><span className="kbd">↑↓</span> navegar</span>
          <span><span className="kbd">↵</span> abrir</span>
          <span><span className="kbd">ESC</span> cerrar</span>
          <div style={{ marginLeft: 'auto' }}>{results.length} resultado{results.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications panel ────────────────────────────────────────
function NotificationsPanel({ data, open, onClose, goTo }) {
  const notifs = useMemoShell(() => {
    if (!data) return [];
    const items = [];
    data.materias.filter((m) => m.stock < m.minimo).forEach((m) => {
      items.push({
        kind: m.stock === 0 ? 'critico' : 'alerta',
        icon: 'alert',
        title: m.stock === 0 ? `${m.nombre} sin stock` : `${m.nombre} bajo mínimo`,
        sub: `${m.stock} / ${m.minimo} ${m.unidad} · ${m.id}`,
        page: 'materias'
      });
    });
    data.productos.filter((p) => p.stock < p.minimo).forEach((p) => {
      items.push({
        kind: p.stock === 0 ? 'critico' : 'alerta',
        icon: 'producto',
        title: `${p.nombre} bajo mínimo`,
        sub: `${p.stock} / ${p.minimo} ${p.presentacion} · ${p.id}`,
        page: 'productos'
      });
    });
    data.ordenes.filter((o) => o.estado === 'En proceso').forEach((o) => {
      items.push({
        kind: 'info', icon: 'produccion',
        title: 'Orden en proceso',
        sub: `${o.id} · ${o.cantidad} u · ${o.operario}`,
        page: 'produccion'
      });
    });
    return items;
  }, [data]);

  if (!open) return null;

  const criticos = notifs.filter((n) => n.kind === 'critico').length;
  const alertas = notifs.filter((n) => n.kind === 'alerta').length;
  const infos = notifs.filter((n) => n.kind === 'info').length;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 56, right: 16, width: 380, maxHeight: '80vh', overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: 'var(--shadow-lg)',
          animation: 'slideIn .15s ease'
        }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={16} />
          <strong style={{ fontSize: 14 }}>Notificaciones</strong>
          <div style={{ flex: 1 }}></div>
          <span className="muted" style={{ fontSize: 12 }}>{notifs.length}</span>
        </div>

        {notifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>
            <Icon name="check" size={20} />
            <div style={{ marginTop: 8 }}>Sin notificaciones nuevas</div>
          </div>
        ) : (
          <>
            <div style={{ padding: 12, display: 'flex', gap: 6, borderBottom: '1px solid var(--line)' }}>
              {criticos > 0 && <span className="pill bad"><span className="dot"></span>{criticos} crítico</span>}
              {alertas > 0 && <span className="pill warn"><span className="dot"></span>{alertas} alerta</span>}
              {infos > 0 && <span className="pill info"><span className="dot"></span>{infos} en proceso</span>}
            </div>
            <div>
              {notifs.map((n, i) => {
                const tone = n.kind === 'critico' ? 'bad' : n.kind === 'alerta' ? 'warn' : 'info';
                return (
                  <div key={i} onClick={() => { goTo(n.page); onClose(); }}
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', cursor: 'pointer', display: 'flex', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: `var(--${tone}-bg)`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={n.icon} size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{n.title}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{n.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.SearchPalette = SearchPalette;
window.NotificationsPanel = NotificationsPanel;

// ── Hover preview universal ───────────────────────────────────────
// Escucha hover sobre elementos con [data-hov-kind][data-hov-id] y muestra mini-tarjeta
function HoverPreview({ data }) {
  const [info, setInfo] = useStateShell(null);
  const timerRef = useRefShell(null);
  const { formatCurrency } = window.SH;

  useEffectShell(() => {
    const onOver = (e) => {
      const el = e.target.closest('[data-hov-kind]');
      if (!el) return;
      clearTimeout(timerRef.current);
      const kind = el.getAttribute('data-hov-kind');
      const id = el.getAttribute('data-hov-id');
      const rect = el.getBoundingClientRect();
      timerRef.current = setTimeout(() => {
        let item, fields = [];
        if (kind === 'MP') {
          item = data.materias.find((m) => m.id === id);
          if (item) fields = [['Categoría', item.categoria], ['Stock', `${item.stock} ${item.unidad}`], ['Mínimo', `${item.minimo} ${item.unidad}`], ['Costo', formatCurrency(item.costo)], ['Proveedor', item.proveedor || '—']];
        } else if (kind === 'PT') {
          item = data.productos.find((p) => p.id === id);
          if (item) fields = [['Presentación', item.presentacion], ['Stock', String(item.stock)], ['Mínimo', String(item.minimo)], ['Precio', formatCurrency(item.precio)]];
        }
        if (item) setInfo({ kind, item, fields, x: rect.left, y: rect.bottom + 6, color: item.color });
      }, 550);
    };
    const onOut = (e) => {
      if (e.target.closest('[data-hov-kind]')) { clearTimeout(timerRef.current); setInfo(null); }
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => { document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut); clearTimeout(timerRef.current); };
  }, [data]);

  if (!info) return null;
  const left = Math.min(info.x, window.innerWidth - 280);
  const top = Math.min(info.y, window.innerHeight - 180);
  return (
    <div className="hovcard" style={{ left, top }}>
      <div className="row gap-8" style={{ marginBottom: 8 }}>
        {info.color ? <span style={{ width: 22, height: 22, borderRadius: 5, background: info.color, border: '1px solid var(--line)' }}></span> : <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg-2)', display: 'grid', placeItems: 'center' }}><Icon name={info.kind === 'MP' ? 'materia' : 'producto'} size={13} /></span>}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{info.item.nombre}</div>
          <div className="muted num" style={{ fontSize: 11 }}>{info.item.id}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: 12 }}>
        {info.fields.map(([k, v]) => (
          <React.Fragment key={k}>
            <span className="muted">{k}</span>
            <span className="num" style={{ textAlign: 'right' }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

window.HoverPreview = HoverPreview;

// ── Page skeleton loader ──────────────────────────────────────────
function PageSkeleton() {
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div className="skel" style={{ width: 240, height: 28, marginBottom: 8 }}></div>
          <div className="skel" style={{ width: 360, height: 14 }}></div>
        </div>
        <div className="skel" style={{ width: 160, height: 36, borderRadius: 6 }}></div>
      </div>
      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        {[0,1,2,3].map((i) => (
          <div className="kpi" key={i}>
            <div className="skel" style={{ width: '60%', height: 12, marginBottom: 10 }}></div>
            <div className="skel" style={{ width: '45%', height: 26, marginBottom: 10 }}></div>
            <div className="skel" style={{ width: '70%', height: 11 }}></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-body">
          {[0,1,2,3,4,5].map((i) => (
            <div className="row" key={i} style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="skel" style={{ width: 70, height: 14 }}></div>
              <div className="skel" style={{ flex: 1, height: 14 }}></div>
              <div className="skel" style={{ width: 90, height: 14 }}></div>
              <div className="skel" style={{ width: 60, height: 14 }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.PageSkeleton = PageSkeleton;
