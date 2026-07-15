// Dashboard module
const { useState: useStateD, useMemo: useMemoD } = React;

function Dashboard({ data, goTo }) {
  const { formatCurrency, formatNum, stockStatus, saludo } = window.SH;
  const { CountUp, Donut, ActivityHeatmap } = window.VIZ;

  const stats = useMemoD(() => {
    const totalMP = data.materias.reduce((a, m) => a + m.stock * m.costo, 0);
    const totalPT = data.productos.reduce((a, p) => a + p.stock * p.precio, 0);
    const lowMP = data.materias.filter((m) => m.stock < m.minimo).length;
    const lowPT = data.productos.filter((p) => p.stock < p.minimo).length;
    const enProceso = data.ordenes.filter((o) => o.estado === 'En proceso').length;
    return { totalMP, totalPT, lowMP, lowPT, enProceso };
  }, [data]);

  const donutData = useMemoD(() => {
    const palette = ['oklch(0.52 0.13 250)', 'oklch(0.55 0.11 210)', 'oklch(0.48 0.14 270)', 'oklch(0.60 0.10 230)', 'oklch(0.45 0.13 290)', 'oklch(0.58 0.12 195)', 'oklch(0.40 0.12 255)'];
    const grupos = {};
    data.materias.forEach((m) => { grupos[m.categoria] = (grupos[m.categoria] || 0) + m.stock * m.costo; });
    return Object.entries(grupos).map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
  }, [data.materias]);

  const alertas = useMemoD(() => {
    const all = [
      ...data.materias.map((m) => ({ ...m, _kind: 'MP' })),
      ...data.productos.map((p) => ({ ...p, _kind: 'PT' }))
    ].filter((x) => x.stock < x.minimo).sort((a, b) => (a.stock / a.minimo) - (b.stock / b.minimo));
    return all.slice(0, 6);
  }, [data]);

  const recientes = data.movimientos.slice(0, 6);
  const actividad = [
    ...(data.pedidos || []).slice(0, 3).map((p) => ({ icon: 'box', titulo: p.id + ' - ' + p.cliente, meta: p.estado + ' - ' + (p.fechaHora || p.fecha), tone: p.estado.includes('OC') ? 'warn' : p.estado.includes('produccion') ? 'info' : 'good' })),
    ...(data.ordenesCompra || []).slice(0, 2).map((o) => ({ icon: 'arrowDn', titulo: o.id + ' - ' + o.proveedorNombre, meta: o.estado + ' - ' + (o.fechaHora || o.fecha), tone: o.estado === 'Emitida' ? 'warn' : 'good' })),
    ...(data.ordenes || []).slice(0, 2).map((o) => ({ icon: 'produccion', titulo: o.id, meta: o.estado + ' - ' + (o.fechaHora || o.fecha), tone: o.estado === 'En proceso' ? 'info' : 'good' }))
  ].slice(0, 7);

  // Real 7-day production chart based on Producción movements
  const chart = useMemoD(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ key: d.toLocaleDateString('es-CO'), d: labels[d.getDay()], v: 0 });
    }
    data.movimientos.forEach((m) => {
      if (m.tipo !== 'Producción' && !(m.tipo === 'Entrada' && m.item.startsWith('PT'))) return;
      const fechaSolo = (m.fecha || '').split(' ')[0]; // "27/05/2026" o similar
      const idx = days.findIndex((x) => x.key === fechaSolo);
      if (idx >= 0) days[idx].v += Math.abs(m.cant);
    });
    return days;
  }, [data.movimientos]);
  const maxV = Math.max(...chart.map((c) => c.v), 1);

  return (
    <div className="page-anim">
      <div className="hero">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>{saludo()}, Gerente</h1>
            <p className="page-sub" style={{ marginTop: 6 }}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · resumen general de inventario y operaciones.</p>
          </div>
          <div className="row gap-8">
            <button className="btn"><Icon name="download" size={14} /> Exportar resumen</button>
            <button className="btn accent" onClick={() => goTo('produccion')}><Icon name="plus" size={14} /> Nueva orden</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid stagger">
        <div className="kpi lift">
          <div className="label">Valor materias primas</div>
          <div className="val" style={{ fontSize: 22 }}><CountUp value={stats.totalMP} format={formatCurrency} /></div>
          <div className="trend">{data.materias.length} ítems registrados</div>
        </div>
        <div className="kpi lift">
          <div className="label">Valor productos terminados</div>
          <div className="val" style={{ fontSize: 22 }}><CountUp value={stats.totalPT} format={formatCurrency} /></div>
          <div className="trend">{data.productos.length} SKUs en catálogo</div>
        </div>
        <div className="kpi lift">
          <div className="label">Alertas de stock</div>
          <div className="val" style={{ color: (stats.lowMP + stats.lowPT) ? 'var(--bad)' : 'inherit' }}><CountUp value={stats.lowMP + stats.lowPT} /></div>
          <div className="trend">{stats.lowMP} MP · {stats.lowPT} PT bajo mínimo</div>
        </div>
        <div className="kpi lift">
          <div className="label">Producción activa</div>
          <div className="val"><CountUp value={stats.enProceso} /><span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>órdenes</span></div>
          <div className="trend">En curso · ver Producción</div>
        </div>
      </div>

      <div className="grid-12-8 mt-24">
        <div className="card">
          <div className="card-head">
            <h3>Producción semanal</h3>
            <span className="meta">Litros fabricados · últimos 7 días</span>
            <div style={{ flex: 1 }}></div>
            <button className="btn ghost sm" onClick={() => goTo('reportes')}>Ver reporte completo <Icon name="arrowR" size={12} /></button>
          </div>
          <div className="card-body">
            <div className="chart-bars">
              {chart.map((c, i) => (
                <div className="col" key={i} title={`${c.v} L`}>
                  <div className="bar2" style={{ height: (c.v / maxV * 100) + '%', background: c.v === 0 ? 'var(--line-2)' : (i === 3 ? 'var(--accent)' : 'oklch(0.65 0.08 38)') }}></div>
                  <div className="lab">{c.d}</div>
                </div>
              ))}
            </div>
            <hr className="sep" />
            <div className="row gap-16" style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Total semana</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{chart.reduce((a,c)=>a+c.v,0)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Promedio diario</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{Math.round(chart.reduce((a,c)=>a+c.v,0)/7)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Mejor día</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{chart.reduce((b,c)=>c.v>b.v?c:b, chart[0])?.d || '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Órdenes completadas</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{data.ordenes.filter((o)=>o.estado==='Completada').length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Alertas de stock</h3>
            <span className="meta">Bajo mínimo</span>
            <div style={{ flex: 1 }}></div>
            <span className="pill bad"><span className="dot"></span> {alertas.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {alertas.map((a) => {
              const st = stockStatus(a.stock, a.minimo);
              return (
                <div key={a._kind + a.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: a._kind === 'PT' ? a.color : 'var(--bg-2)', border: '1px solid var(--line)' }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{a._kind === 'MP' ? a.categoria : a.presentacion} · {a.id}</div>
                  </div>
                  <span className={"pill " + st.tone}><span className="dot"></span>{a.stock} / {a.minimo}</span>
                </div>
              );
            })}
            {alertas.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin alertas activas</div>}
          </div>
        </div>
      </div>

      <div className="grid-12-8 mt-24">
        <div className="card">
          <div className="card-head">
            <h3>Actividad en vivo</h3>
            <span className="meta">Pedidos, compras y produccion</span>
          </div>
          <div className="card-body">
            <div className="live-feed">
              {actividad.map((a, i) => (
                <div className="feed-item" key={i}>
                  <div className={"feed-dot " + a.tone}><Icon name={a.icon} size={14} /></div>
                  <div>
                    <div className="feed-title">{a.titulo}</div>
                    <div className="feed-meta">{a.meta}</div>
                  </div>
                  <span className={"pill " + a.tone}><span className="dot"></span>{a.tone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Semaforo de inventario</h3>
            <span className="meta">Productos terminados</span>
          </div>
          <div className="card-body col gap-12">
            {data.productos.slice(0, 5).map((p) => {
              const pct = Math.max(0, Math.min(100, Math.round((p.stock / Math.max(p.minimo * 2, 1)) * 100)));
              const st = stockStatus(p.stock, p.minimo);
              return (
                <div key={p.id}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div>
                    <span className={"pill " + st.tone}><span className="dot"></span>{p.stock} / {p.minimo}</span>
                  </div>
                  <div className="stock-meter"><span style={{ width: pct + '%' }}></span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-12-8 mt-24">
        <div className="card">
          <div className="card-head">
            <h3>Mezcla del inventario</h3>
            <span className="meta">Valor de MP por categoría</span>
          </div>
          <div className="card-body">
            <div className="row gap-16" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Donut data={donutData} size={150} centerLabel="categorías" centerValue={donutData.length} />
              <div className="donut-legend" style={{ flex: 1, minWidth: 160 }}>
                {donutData.length === 0 ? <span className="muted">Sin materias primas</span> : donutData.map((d) => {
                  const total = donutData.reduce((a, x) => a + x.value, 0) || 1;
                  return (
                    <div className="lg" key={d.label}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }}></span>
                      <span style={{ flex: 1 }}>{d.label}</span>
                      <span className="num muted">{(d.value / total * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Actividad de inventario</h3>
            <span className="meta">Últimas 13 semanas</span>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <ActivityHeatmap movimientos={data.movimientos} weeks={9} />
            <div className="row gap-8" style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-3)', alignItems: 'center' }}>
              <span>Menos</span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--bg-2)' }}></span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'oklch(0.85 0.05 240)' }}></span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'oklch(0.72 0.09 245)' }}></span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'oklch(0.60 0.12 250)' }}></span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: 'oklch(0.48 0.14 255)' }}></span>
              <span>Más</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-12-8 mt-24">
        <div className="card">
          <div className="card-head">
            <h3>Movimientos recientes</h3>
            <span className="meta">Últimas operaciones del sistema</span>
            <div style={{ flex: 1 }}></div>
            <button className="btn ghost sm" onClick={() => goTo('reportes')}>Ver todo <Icon name="arrowR" size={12} /></button>
          </div>
          <table className="t">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Item</th><th>Cant.</th><th>Documento</th><th>Usuario</th></tr></thead>
            <tbody>
              {recientes.map((m, i) => (
                <tr key={i}>
                  <td className="muted num">{m.fecha}</td>
                  <td>
                    <span className={"pill " + (m.tipo === 'Salida' ? 'bad' : m.tipo === 'Entrada' ? 'good' : 'accent')}>
                      <span className="dot"></span>{m.tipo}
                    </span>
                  </td>
                  <td className="num">{m.item}</td>
                  <td className="num" style={{ color: m.cant < 0 ? 'var(--bad)' : 'var(--good)', fontWeight: 600 }}>
                    {m.cant > 0 ? '+' : ''}{m.cant}
                  </td>
                  <td className="num muted">{m.doc}</td>
                  <td className="muted">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Órdenes de producción</h3>
            <span className="meta">En curso y próximas</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data.ordenes.map((o) => {
              const prod = data.productos.find((p) => p.id === o.producto);
              const tone = o.estado === 'Completada' ? 'good' : o.estado === 'En proceso' ? 'info' : 'warn';
              return (
                <div key={o.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="num" style={{ fontWeight: 600, fontSize: 13 }}>{o.id}</div>
                    <span className={"pill " + tone}><span className="dot"></span>{o.estado}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>{prod?.nombre}</div>
                  <div className="row muted" style={{ fontSize: 12, marginTop: 4, justifyContent: 'space-between' }}>
                    <span><span className="num">{o.cantidad}</span> {prod?.presentacion === '1 gal' ? 'gal' : 'L'} · {o.operario}</span>
                    <span className="num">{o.fecha}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
