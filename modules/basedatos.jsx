// Módulo Base de datos — esquema relacional
const { useState: useStateDB, useMemo: useMemoDB } = React;

const SCHEMA = {
  tablas: [
    {
      name: 'Usuarios', key: 'usuarios', color: 'oklch(0.55 0.14 38)', pos: { x: 40, y: 30 },
      desc: 'Personas que acceden al sistema',
      fields: [
        { name: 'id_usuario', type: 'INT', tag: 'PK' },
        { name: 'nombre', type: 'TEXT' },
        { name: 'usuario', type: 'TEXT', tag: 'UQ' },
        { name: 'contraseña', type: 'TEXT' },
        { name: 'rol', type: 'TEXT' },
        { name: 'estado', type: 'TEXT' }
      ]
    },
    {
      name: 'Proveedores', key: 'proveedores', color: 'oklch(0.50 0.10 230)', pos: { x: 40, y: 290 },
      desc: 'Empresas que suministran materias primas',
      fields: [
        { name: 'id_proveedor', type: 'INT', tag: 'PK' },
        { name: 'nombre_proveedor', type: 'TEXT' },
        { name: 'teléfono', type: 'TEXT' },
        { name: 'correo', type: 'TEXT' },
        { name: 'dirección', type: 'TEXT' },
        { name: 'producto_suministrado', type: 'TEXT' }
      ]
    },
    {
      name: 'Materias_Primas', key: 'materias', color: 'oklch(0.55 0.12 150)', pos: { x: 360, y: 290 },
      desc: 'Insumos para fabricar pinturas',
      fields: [
        { name: 'id_materia_prima', type: 'INT', tag: 'PK' },
        { name: 'nombre', type: 'TEXT' },
        { name: 'categoria', type: 'TEXT' },
        { name: 'unidad_medida', type: 'TEXT' },
        { name: 'cantidad_actual', type: 'DECIMAL' },
        { name: 'stock_minimo', type: 'DECIMAL' },
        { name: 'id_proveedor', type: 'INT', tag: 'FK', ref: 'proveedores' }
      ]
    },
    {
      name: 'Productos_Terminados', key: 'productos', color: 'oklch(0.55 0.14 38)', pos: { x: 700, y: 30 },
      desc: 'Pinturas ya fabricadas',
      fields: [
        { name: 'id_producto', type: 'INT', tag: 'PK' },
        { name: 'nombre_producto', type: 'TEXT' },
        { name: 'tipo_producto', type: 'TEXT' },
        { name: 'color', type: 'TEXT' },
        { name: 'presentación', type: 'TEXT' },
        { name: 'cantidad_actual', type: 'DECIMAL' },
        { name: 'stock_minimo', type: 'DECIMAL' }
      ]
    },
    {
      name: 'Producción', key: 'produccion', color: 'oklch(0.55 0.14 38)', pos: { x: 1040, y: 30 },
      desc: 'Registro de procesos de fabricación',
      fields: [
        { name: 'id_produccion', type: 'INT', tag: 'PK' },
        { name: 'fecha', type: 'DATE' },
        { name: 'id_producto', type: 'INT', tag: 'FK', ref: 'productos' },
        { name: 'cantidad_producida', type: 'DECIMAL' },
        { name: 'responsable', type: 'TEXT' },
        { name: 'observaciones', type: 'TEXT' }
      ]
    },
    {
      name: 'Detalle_Producción', key: 'detalle', color: 'oklch(0.55 0.12 150)', pos: { x: 700, y: 290 },
      desc: 'Materias primas usadas por orden',
      fields: [
        { name: 'id_detalle', type: 'INT', tag: 'PK' },
        { name: 'id_produccion', type: 'INT', tag: 'FK', ref: 'produccion' },
        { name: 'id_materia_prima', type: 'INT', tag: 'FK', ref: 'materias' },
        { name: 'cantidad_utilizada', type: 'DECIMAL' }
      ]
    },
    {
      name: 'Movimientos_Inventario', key: 'movimientos', color: 'oklch(0.65 0.14 70)', pos: { x: 360, y: 560 },
      desc: 'Entradas y salidas de inventario',
      fields: [
        { name: 'id_movimiento', type: 'INT', tag: 'PK' },
        { name: 'fecha', type: 'DATE' },
        { name: 'tipo_movimiento', type: 'TEXT' },
        { name: 'tipo_item', type: 'TEXT' },
        { name: 'id_item', type: 'INT' },
        { name: 'cantidad', type: 'DECIMAL' },
        { name: 'motivo', type: 'TEXT' },
        { name: 'id_usuario', type: 'INT', tag: 'FK', ref: 'usuarios' }
      ]
    },
    {
      name: 'Alertas_Inventario', key: 'alertas', color: 'oklch(0.55 0.18 25)', pos: { x: 1040, y: 560 },
      desc: 'Avisos de bajo inventario',
      fields: [
        { name: 'id_alerta', type: 'INT', tag: 'PK' },
        { name: 'tipo_item', type: 'TEXT' },
        { name: 'id_item', type: 'INT' },
        { name: 'cantidad_actual', type: 'DECIMAL' },
        { name: 'fecha_alerta', type: 'DATE' },
        { name: 'estado', type: 'TEXT' }
      ]
    },
    {
      name: 'Categorías', key: 'categorias', color: 'oklch(0.55 0.10 280)', pos: { x: 40, y: 560 },
      desc: 'Clasificación de items',
      fields: [
        { name: 'id_categoria', type: 'INT', tag: 'PK' },
        { name: 'nombre_categoria', type: 'TEXT' },
        { name: 'aplica_a', type: 'TEXT' },
        { name: 'descripcion', type: 'TEXT' }
      ]
    }
  ],
  relaciones: [
    { from: 'proveedores', to: 'materias',   label: '1 : N', desc: 'Un proveedor suministra varias materias primas' },
    { from: 'productos',   to: 'produccion', label: '1 : N', desc: 'Un producto terminado se fabrica en varias órdenes' },
    { from: 'produccion',  to: 'detalle',    label: '1 : N', desc: 'Una orden de producción usa varias MP' },
    { from: 'materias',    to: 'detalle',    label: '1 : N', desc: 'Una MP se usa en varias producciones' },
    { from: 'usuarios',    to: 'movimientos',label: '1 : N', desc: 'Un usuario registra varios movimientos' },
    { from: 'materias',    to: 'movimientos',label: '1 : N', desc: 'Cada MP genera movimientos de inventario' },
    { from: 'productos',   to: 'movimientos',label: '1 : N', desc: 'Cada PT genera movimientos de inventario' }
  ]
};

function BaseDatos() {
  const { Tabs } = window.SH;
  const [tab, setTab] = useStateDB('diagrama');
  const [selected, setSelected] = useStateDB(null);
  const [zoom, setZoom] = useStateDB(1);

  const W = 1320, H = 760;
  const tablaWidth = 260;
  const headerH = 38;
  const rowH = 26;

  const tablaH = (t) => headerH + t.fields.length * rowH + 8;
  const fieldY = (t, idx) => t.pos.y + headerH + idx * rowH + rowH / 2;

  // Edges
  const edges = useMemoDB(() => {
    return SCHEMA.relaciones.map((r) => {
      const a = SCHEMA.tablas.find((t) => t.key === r.from);
      const b = SCHEMA.tablas.find((t) => t.key === r.to);
      // anchor mid-vert
      const ax = a.pos.x + tablaWidth / 2;
      const ay = a.pos.y + tablaH(a) / 2;
      const bx = b.pos.x + tablaWidth / 2;
      const by = b.pos.y + tablaH(b) / 2;
      // pick side
      const dx = bx - ax, dy = by - ay;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      let p1, p2;
      if (horizontal) {
        p1 = { x: ax + (dx > 0 ? tablaWidth / 2 : -tablaWidth / 2), y: ay };
        p2 = { x: bx + (dx > 0 ? -tablaWidth / 2 : tablaWidth / 2), y: by };
      } else {
        p1 = { x: ax, y: ay + (dy > 0 ? tablaH(a) / 2 : -tablaH(a) / 2) };
        p2 = { x: bx, y: by + (dy > 0 ? -tablaH(b) / 2 : tablaH(b) / 2) };
      }
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const path = `M ${p1.x} ${p1.y} C ${horizontal ? cx : p1.x} ${horizontal ? p1.y : cy}, ${horizontal ? cx : p2.x} ${horizontal ? p2.y : cy}, ${p2.x} ${p2.y}`;
      return { ...r, path, mid: { x: cx, y: cy }, p1, p2 };
    });
  }, []);

  const isHighlighted = (key) => {
    if (!selected) return false;
    if (selected === key) return true;
    return SCHEMA.relaciones.some((r) => (r.from === selected && r.to === key) || (r.to === selected && r.from === key));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Diseño de la base de datos</h1>
          <p className="page-sub">Estructura relacional del sistema. {SCHEMA.tablas.length} tablas y {SCHEMA.relaciones.length} relaciones que organizan la información de materias primas, productos, producción, movimientos y usuarios.</p>
        </div>
        <div className="row gap-8">
          <button className="btn"><Icon name="download" size={14} /> Exportar SQL</button>
          <button className="btn"><Icon name="download" size={14} /> Exportar PDF</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">Tablas</div><div className="val">{SCHEMA.tablas.length}</div><div className="trend">Modelo relacional</div></div>
        <div className="kpi"><div className="label">Campos totales</div><div className="val">{SCHEMA.tablas.reduce((a, t) => a + t.fields.length, 0)}</div><div className="trend">Atributos definidos</div></div>
        <div className="kpi"><div className="label">Relaciones</div><div className="val">{SCHEMA.relaciones.length}</div><div className="trend">Claves foráneas</div></div>
        <div className="kpi"><div className="label">Motor sugerido</div><div className="val" style={{ fontSize: 20 }}>PostgreSQL</div><div className="trend">o MySQL 8+</div></div>
      </div>

      <Tabs items={[
        { value: 'diagrama', label: 'Diagrama ER' },
        { value: 'tablas',   label: 'Definición de tablas', count: SCHEMA.tablas.length },
        { value: 'relaciones', label: 'Relaciones', count: SCHEMA.relaciones.length },
      ]} value={tab} onChange={setTab} />

      {tab === 'diagrama' && (
        <div className="card">
          <div className="card-head">
            <h3>Modelo entidad-relación</h3>
            <span className="meta">Haz clic en una tabla para resaltar sus relaciones</span>
            <div style={{ flex: 1 }}></div>
            <div className="row gap-8">
              <button className="btn sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</button>
              <span className="num muted" style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button className="btn sm" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>+</button>
              <button className="btn sm ghost" onClick={() => { setZoom(1); setSelected(null); }}>Reset</button>
            </div>
          </div>
          <div style={{
            background:
              'repeating-linear-gradient(0deg, transparent 0 23px, rgba(0,0,0,.025) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(0,0,0,.025) 23px 24px), var(--bg-2)',
            padding: 24, overflow: 'auto', maxHeight: 720
          }}>
            <svg
              width={W * zoom} height={H * zoom} viewBox={`0 0 ${W} ${H}`}
              style={{ display: 'block', fontFamily: 'var(--font)' }}
              onClick={(e) => { if (e.target.tagName === 'svg') setSelected(null); }}
            >
              <defs>
                <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-3)" />
                </marker>
                <marker id="arrH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
                </marker>
              </defs>

              {/* Edges */}
              {edges.map((e, i) => {
                const hot = selected && (e.from === selected || e.to === selected);
                return (
                  <g key={i} opacity={selected && !hot ? 0.18 : 1}>
                    <path d={e.path} fill="none"
                      stroke={hot ? 'var(--accent)' : 'var(--ink-4)'}
                      strokeWidth={hot ? 2 : 1.4}
                      strokeDasharray={hot ? '0' : '4 3'}
                      markerEnd={hot ? 'url(#arrH)' : 'url(#arr)'} />
                    <g transform={`translate(${e.mid.x}, ${e.mid.y})`}>
                      <rect x="-18" y="-9" width="36" height="18" rx="9" fill="#fff" stroke={hot ? 'var(--accent)' : 'var(--line)'} />
                      <text textAnchor="middle" dy="4" fontSize="10.5" fontFamily="JetBrains Mono, monospace" fill={hot ? 'var(--accent)' : 'var(--ink-3)'} fontWeight="600">{e.label}</text>
                    </g>
                  </g>
                );
              })}

              {/* Tables */}
              {SCHEMA.tablas.map((t) => {
                const high = isHighlighted(t.key);
                return (
                  <g key={t.key} transform={`translate(${t.pos.x}, ${t.pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelected(t.key === selected ? null : t.key); }}>
                    {/* card */}
                    <rect width={tablaWidth} height={tablaH(t)} rx="8" fill="#fff"
                      stroke={high ? t.color : 'var(--line)'}
                      strokeWidth={high ? 2 : 1}
                      filter={high ? 'drop-shadow(0 4px 12px rgba(20,18,12,.18))' : 'drop-shadow(0 1px 2px rgba(20,18,12,.06))'}
                      opacity={selected && !high ? 0.5 : 1}
                    />
                    {/* header */}
                    <rect width={tablaWidth} height={headerH} rx="8" fill={t.color} opacity={selected && !high ? 0.5 : 1} />
                    <rect y={headerH - 8} width={tablaWidth} height="8" fill={t.color} opacity={selected && !high ? 0.5 : 1} />
                    <text x="14" y="24" fill="white" fontWeight="700" fontSize="13.5">{t.name}</text>
                    <text x={tablaWidth - 14} y="24" fill="rgba(255,255,255,.75)" fontSize="10.5" textAnchor="end" fontFamily="JetBrains Mono, monospace">{t.fields.length} campos</text>

                    {/* fields */}
                    {t.fields.map((f, i) => (
                      <g key={f.name} transform={`translate(0, ${headerH + i * rowH})`} opacity={selected && !high ? 0.5 : 1}>
                        {i % 2 === 0 && <rect x="1" y="0" width={tablaWidth - 2} height={rowH} fill="oklch(0.99 0.005 80)" />}
                        <text x="14" y={rowH / 2 + 4} fontSize="11.5" fontFamily="JetBrains Mono, monospace"
                          fill={f.tag === 'PK' ? 'var(--ink)' : 'var(--ink-2)'}
                          fontWeight={f.tag === 'PK' ? 600 : 400}>
                          {f.name}
                        </text>
                        <text x={tablaWidth - 14} y={rowH / 2 + 4} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--ink-3)" textAnchor="end">
                          {f.type}
                        </text>
                        {f.tag && (
                          <g transform={`translate(${tablaWidth - 64}, ${rowH / 2 - 8})`}>
                            <rect width="22" height="14" rx="3" fill={f.tag === 'PK' ? 'oklch(0.95 0.04 60)' : 'oklch(0.95 0.03 230)'} />
                            <text x="11" y="10.5" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle"
                              fill={f.tag === 'PK' ? 'oklch(0.55 0.14 38)' : 'oklch(0.50 0.10 230)'} fontWeight="700">{f.tag}</text>
                          </g>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 16, fontSize: 12 }} className="muted">
            <span><span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: 3, background: 'oklch(0.95 0.04 60)', color: 'oklch(0.55 0.14 38)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700 }}>PK</span> Llave primaria</span>
            <span><span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: 3, background: 'oklch(0.95 0.03 230)', color: 'oklch(0.50 0.10 230)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700 }}>FK</span> Llave foránea</span>
            <span><span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: 3, background: 'oklch(0.95 0.04 60)', color: 'oklch(0.55 0.14 38)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700 }}>UQ</span> Único</span>
            <span style={{ marginLeft: 'auto' }}>Líneas punteadas representan relaciones 1:N</span>
          </div>
        </div>
      )}

      {tab === 'tablas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          {SCHEMA.tablas.map((t) => (
            <div className="card" key={t.key}>
              <div style={{ height: 6, background: t.color, borderRadius: '8px 8px 0 0' }}></div>
              <div className="card-head" style={{ borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{t.name}</h3>
                <span className="meta">{t.fields.length} campos</span>
              </div>
              <div style={{ padding: '8px 16px 4px', color: 'var(--ink-3)', fontSize: 12.5 }}>{t.desc}</div>
              <table className="t" style={{ marginTop: 4 }}>
                <thead><tr><th>Campo</th><th>Tipo</th><th style={{ textAlign: 'right' }}></th></tr></thead>
                <tbody>
                  {t.fields.map((f) => (
                    <tr key={f.name}>
                      <td className="num" style={{ fontSize: 12.5, fontWeight: f.tag === 'PK' ? 600 : 400 }}>{f.name}</td>
                      <td className="num muted" style={{ fontSize: 11.5 }}>{f.type}</td>
                      <td style={{ textAlign: 'right' }}>
                        {f.tag && (
                          <span className={"pill " + (f.tag === 'PK' ? 'accent' : f.tag === 'FK' ? 'info' : '')} style={{ fontSize: 10, padding: '1px 6px' }}>
                            {f.tag}{f.ref ? ' → ' + f.ref : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'relaciones' && (
        <div className="card">
          <div className="card-head"><h3>Relaciones entre tablas</h3><span className="meta">Cardinalidad y propósito</span></div>
          <table className="t">
            <thead><tr><th>Origen</th><th></th><th>Destino</th><th>Cardinalidad</th><th>Explicación</th></tr></thead>
            <tbody>
              {SCHEMA.relaciones.map((r, i) => {
                const a = SCHEMA.tablas.find((t) => t.key === r.from);
                const b = SCHEMA.tablas.find((t) => t.key === r.to);
                return (
                  <tr key={i}>
                    <td>
                      <span className="pill" style={{ background: 'transparent', borderColor: a.color, color: a.color }}>
                        <span className="dot" style={{ background: a.color }}></span>{a.name}
                      </span>
                    </td>
                    <td className="muted"><Icon name="arrowR" size={14} /></td>
                    <td>
                      <span className="pill" style={{ background: 'transparent', borderColor: b.color, color: b.color }}>
                        <span className="dot" style={{ background: b.color }}></span>{b.name}
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>{r.label}</td>
                    <td className="muted">{r.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

window.BaseDatos = BaseDatos;
