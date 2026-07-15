// Módulo Reportes
const { useState: useStateRE, useMemo: useMemoRE } = React;

function Reportes({ data }) {
  const { formatCurrency, formatNum, Tabs } = window.SH;
  const [tab, setTab] = useStateRE('inventario');
  const [rango, setRango] = useStateRE('30d');

  // --- Inventario report ---
  const porCategoria = useMemoRE(() => {
    const m = {};
    data.materias.forEach((x) => {
      m[x.categoria] = m[x.categoria] || { categoria: x.categoria, items: 0, valor: 0 };
      m[x.categoria].items++;
      m[x.categoria].valor += x.stock * x.costo;
    });
    return Object.values(m).sort((a, b) => b.valor - a.valor);
  }, [data]);

  const totalMP = data.materias.reduce((a, m) => a + m.stock * m.costo, 0);
  const maxCat = Math.max(...porCategoria.map((c) => c.valor), 1);

  // --- Movimientos ---
  const movEntradas = data.movimientos.filter((m) => m.tipo === 'Entrada');
  const movSalidas = data.movimientos.filter((m) => m.tipo === 'Salida');
  const movProd = data.movimientos.filter((m) => m.tipo === 'Producción');

  // --- Bajo stock ---
  const alertas = [
    ...data.materias.map((m) => ({ ...m, _kind: 'MP' })),
    ...data.productos.map((p) => ({ ...p, _kind: 'PT' }))
  ].filter((x) => x.stock < x.minimo);

  // --- Consumo de MP ---
  const consumoMP = useMemoRE(() => {
    const m = {};
    Object.entries(data.recetas).forEach(([ptId, rec]) => {
      const ordCompl = data.ordenes.filter((o) => o.producto === ptId && o.estado === 'Completada');
      const totalCant = ordCompl.reduce((a, o) => a + o.cantidad, 0);
      rec.forEach((r) => {
        m[r.mp] = (m[r.mp] || 0) + r.cant * totalCant;
      });
    });
    return Object.entries(m).map(([id, c]) => {
      const mp = data.materias.find((x) => x.id === id);
      return { ...mp, consumido: c };
    }).sort((a, b) => b.consumido * b.costo - a.consumido * a.costo);
  }, [data]);

  const tabs = [
    { value: 'inventario', label: 'Inventario' },
    { value: 'movimientos', label: 'Movimientos' },
    { value: 'consumo', label: 'Consumo MP' },
    { value: 'abc', label: 'Análisis ABC' },
    { value: 'rentab', label: 'Rentabilidad' },
    { value: 'prediccion', label: 'Predicción quiebres' },
    { value: 'alertas', label: 'Stock bajo', count: alertas.length },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">Información consolidada sobre inventario, entradas y salidas, producción y consumo. Útil para la toma de decisiones operativas y financieras.</p>
        </div>
        <div className="row gap-8">
          <select className="select" value={rango} onChange={(e) => setRango(e.target.value)}>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="ytd">Año actual</option>
          </select>
          <button className="btn" onClick={() => exportarReporte(tab, data)}><Icon name="download" size={14} /> Exportar Excel</button>
          <button className="btn primary" onClick={() => exportarReporte(tab, data, 'csv')}><Icon name="download" size={14} /> CSV</button>
        </div>
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === 'inventario' && (
        <>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="kpi"><div className="label">Valor MP</div><div className="val">{formatCurrency(totalMP)}</div><div className="trend">{data.materias.length} ítems</div></div>
            <div className="kpi"><div className="label">Valor PT</div><div className="val">{formatCurrency(data.productos.reduce((a, p) => a + p.stock * p.precio, 0))}</div><div className="trend">{data.productos.length} SKUs</div></div>
            <div className="kpi"><div className="label">Rotación promedio</div><div className="val">12.4<span className="muted" style={{ fontSize: 14 }}> días</span></div><div className="trend">↓ 1.8 días vs. mes anterior</div></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Distribución de valor por categoría</h3><span className="meta">Materias primas — costo de adquisición</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {porCategoria.map((c) => (
                  <div key={c.categoria}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 500 }}>{c.categoria}</div>
                      <div className="row gap-12">
                        <span className="muted num" style={{ fontSize: 12 }}>{c.items} ítems</span>
                        <span className="num" style={{ fontWeight: 600 }}>{formatCurrency(c.valor)}</span>
                        <span className="num muted" style={{ fontSize: 12, width: 50, textAlign: 'right' }}>{(c.valor / totalMP * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="bar"><span style={{ width: (c.valor / maxCat * 100) + '%' }}></span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2 mt-24">
            <div className="card">
              <div className="card-head"><h3>Top productos por valor en stock</h3></div>
              <table className="t">
                <thead><tr><th>Producto</th><th>Stock</th><th>Valor</th></tr></thead>
                <tbody>
                  {[...data.productos].sort((a,b) => b.stock*b.precio - a.stock*a.precio).slice(0,5).map((p) => (
                    <tr key={p.id}>
                      <td><span className="swatch" style={{ background: p.color }}></span>{p.nombre}</td>
                      <td className="num">{p.stock}</td>
                      <td className="num" style={{ fontWeight: 500 }}>{formatCurrency(p.stock * p.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-head"><h3>Top materias primas por valor</h3></div>
              <table className="t">
                <thead><tr><th>Materia prima</th><th>Stock</th><th>Valor</th></tr></thead>
                <tbody>
                  {[...data.materias].sort((a,b) => b.stock*b.costo - a.stock*a.costo).slice(0,5).map((m) => (
                    <tr key={m.id}>
                      <td>{m.nombre}<div className="muted" style={{ fontSize: 11 }}>{m.categoria}</div></td>
                      <td className="num">{m.stock} {m.unidad}</td>
                      <td className="num" style={{ fontWeight: 500 }}>{formatCurrency(m.stock * m.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'movimientos' && (
        <>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="kpi"><div className="label">Entradas</div><div className="val" style={{ color: 'var(--good)' }}>{movEntradas.length}</div><div className="trend">+{movEntradas.reduce((a,m)=>a+m.cant,0)} unidades</div></div>
            <div className="kpi"><div className="label">Salidas</div><div className="val" style={{ color: 'var(--bad)' }}>{movSalidas.length}</div><div className="trend">{movSalidas.reduce((a,m)=>a+m.cant,0)} unidades</div></div>
            <div className="kpi"><div className="label">Producción</div><div className="val" style={{ color: 'var(--accent)' }}>{movProd.length}</div><div className="trend">+{movProd.reduce((a,m)=>a+m.cant,0)} unidades</div></div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Registro de movimientos</h3><span className="meta">Bitácora completa</span></div>
            <table className="t">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Item</th><th>Cantidad</th><th>Documento</th><th>Usuario</th></tr></thead>
              <tbody>
                {data.movimientos.map((m, i) => (
                  <tr key={i}>
                    <td className="muted num">{m.fecha}</td>
                    <td><span className={"pill " + (m.tipo === 'Salida' ? 'bad' : m.tipo === 'Entrada' ? 'good' : 'accent')}><span className="dot"></span>{m.tipo}</span></td>
                    <td className="num">{m.item}</td>
                    <td className="num" style={{ color: m.cant < 0 ? 'var(--bad)' : 'var(--good)', fontWeight: 600 }}>{m.cant > 0 ? '+' : ''}{m.cant}</td>
                    <td className="num muted">{m.doc}</td>
                    <td>{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'consumo' && (
        <div className="card">
          <div className="card-head"><h3>Consumo de materias primas</h3><span className="meta">Calculado sobre órdenes completadas</span></div>
          {consumoMP.length === 0 ? (
            <div className="card-body"><div className="muted">Sin órdenes completadas en el período.</div></div>
          ) : (
            <table className="t">
              <thead><tr><th>Materia prima</th><th>Consumido</th><th>Stock restante</th><th>Costo consumido</th><th>Cobertura</th></tr></thead>
              <tbody>
                {consumoMP.map((c) => {
                  const cobertura = c.consumido > 0 ? Math.round(c.stock / c.consumido * 30) : 999;
                  return (
                    <tr key={c.id}>
                      <td><div style={{ fontWeight: 500 }}>{c.nombre}</div><div className="muted" style={{ fontSize: 11 }}>{c.categoria}</div></td>
                      <td className="num" style={{ fontWeight: 500 }}>{c.consumido.toFixed(2)} {c.unidad}</td>
                      <td className="num">{c.stock} {c.unidad}</td>
                      <td className="num">{formatCurrency(c.consumido * c.costo)}</td>
                      <td>
                        <span className={"pill " + (cobertura < 15 ? 'bad' : cobertura < 30 ? 'warn' : 'good')}>
                          <span className="dot"></span>~{cobertura > 200 ? '200+' : cobertura} días
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'alertas' && (
        <div className="card">
          <div className="card-head"><h3>Productos e insumos bajo stock mínimo</h3><span className="meta">Requieren reposición</span></div>
          {alertas.length === 0 ? (
            <div className="card-body"><div className="muted">No hay alertas activas.</div></div>
          ) : (
            <table className="t">
              <thead><tr><th>Tipo</th><th>Código</th><th>Nombre</th><th>Stock</th><th>Mínimo</th><th>Déficit</th><th>Recomendación</th></tr></thead>
              <tbody>
                {alertas.map((a) => (
                  <tr key={a._kind + a.id}>
                    <td><span className={"pill " + (a._kind === 'MP' ? 'info' : 'accent')}>{a._kind}</span></td>
                    <td className="num">{a.id}</td>
                    <td>{a.nombre}</td>
                    <td className="num" style={{ color: a.stock === 0 ? 'var(--bad)' : 'var(--warn)', fontWeight: 600 }}>{a.stock}</td>
                    <td className="num muted">{a.minimo}</td>
                    <td className="num">{a.minimo - a.stock}</td>
                    <td className="muted">
                      {a._kind === 'MP' ? `Solicitar a ${a.proveedor}` : 'Programar producción'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'abc' && <AnalisisABC data={data} />}
      {tab === 'rentab' && <Rentabilidad data={data} />}
      {tab === 'prediccion' && <PrediccionQuiebres data={data} />}
    </>
  );
}

// --- ABC Analysis ---
function AnalisisABC({ data }) {
  const { formatCurrency, Tabs } = window.SH;
  const [sub, setSub] = useStateRE('mp');
  const items = sub === 'mp' ? data.materias.map((m) => ({ ...m, _kind: 'MP' })) : data.productos.map((p) => ({ ...p, _kind: 'PT' }));
  const getValor = (x) => x._kind === 'MP' ? x.stock * x.costo : x.stock * x.precio;
  const clasificados = window.UT.clasificarABC(items, getValor);

  const stats = { A: 0, B: 0, C: 0 };
  clasificados.forEach((x) => stats[x._clase]++);

  return (
    <>
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)' }}>
        <strong>Principio de Pareto:</strong> el 20% de los ítems suele representar el 80% del valor. La clasificación ABC ayuda a priorizar el control de inventario en los más críticos.
      </div>
      <Tabs items={[
        { value: 'mp', label: 'Materias primas', count: data.materias.length },
        { value: 'pt', label: 'Productos terminados', count: data.productos.length }
      ]} value={sub} onChange={setSub} />
      <div className="grid-3" style={{ marginBottom: 14 }}>
        <div className="kpi"><div className="label">Clase A (80% del valor)</div><div className="val" style={{ color: 'var(--bad)' }}>{stats.A}</div><div className="trend">Alta prioridad de control</div></div>
        <div className="kpi"><div className="label">Clase B (15%)</div><div className="val" style={{ color: 'var(--warn)' }}>{stats.B}</div><div className="trend">Control moderado</div></div>
        <div className="kpi"><div className="label">Clase C (5%)</div><div className="val" style={{ color: 'var(--good)' }}>{stats.C}</div><div className="trend">Control básico</div></div>
      </div>
      <div className="card">
        <table className="t">
          <thead><tr><th>Clase</th><th>Ítem</th><th className="num" style={{textAlign:'right'}}>Valor</th><th className="num" style={{textAlign:'right'}}>% del total</th><th className="num" style={{textAlign:'right'}}>% acumulado</th></tr></thead>
          <tbody>
            {clasificados.map((x) => (
              <tr key={x.id}>
                <td><span className={"pill " + (x._clase === 'A' ? 'bad' : x._clase === 'B' ? 'warn' : 'good')}><span className="dot"></span>{x._clase}</span></td>
                <td>{x.nombre}<div className="muted num" style={{ fontSize: 11 }}>{x.id}</div></td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(x._valor)}</td>
                <td className="num" style={{ textAlign: 'right' }}>{x._pct.toFixed(2)}%</td>
                <td className="num muted" style={{ textAlign: 'right' }}>{x._acum.toFixed(2)}%</td>
              </tr>
            ))}
            {clasificados.length === 0 && <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin datos para analizar</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Rentabilidad ---
function Rentabilidad({ data }) {
  const { formatCurrency } = window.SH;
  const productos = data.productos.map((p) => {
    const receta = data.recetas[p.id] || [];
    const costoUnit = receta.reduce((a, r) => {
      const mp = data.materias.find((m) => m.id === r.mp);
      return a + (mp ? mp.costo * r.cant : 0);
    }, 0);
    const margenAbs = p.precio - costoUnit;
    const margenPct = p.precio ? (margenAbs / p.precio * 100) : 0;
    // ventas históricas (salidas)
    const vendidas = data.movimientos
      .filter((m) => m.item === p.id && m.tipo === 'Salida')
      .reduce((a, m) => a + Math.abs(m.cant), 0);
    const ingresos = vendidas * p.precio;
    const costosTot = vendidas * costoUnit;
    const utilidad = ingresos - costosTot;
    return { ...p, costoUnit, margenAbs, margenPct, vendidas, ingresos, costosTot, utilidad };
  }).sort((a, b) => b.utilidad - a.utilidad);

  const totalUtil = productos.reduce((a, p) => a + p.utilidad, 0);
  const totalIng = productos.reduce((a, p) => a + p.ingresos, 0);

  return (
    <>
      <div className="grid-3" style={{ marginBottom: 14 }}>
        <div className="kpi"><div className="label">Ingresos totales</div><div className="val" style={{ fontSize: 22 }}>{formatCurrency(totalIng)}</div><div className="trend">Histórico de ventas</div></div>
        <div className="kpi"><div className="label">Utilidad acumulada</div><div className="val" style={{ fontSize: 22, color: 'var(--good)' }}>{formatCurrency(totalUtil)}</div><div className="trend">Ingresos − costos MP</div></div>
        <div className="kpi"><div className="label">Margen promedio</div><div className="val">{totalIng ? Math.round(totalUtil / totalIng * 100) : 0}%</div><div className="trend">Ponderado por ingresos</div></div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Rentabilidad por producto</h3><span className="meta">Ordenado por utilidad acumulada</span></div>
        <table className="t">
          <thead><tr><th>Producto</th><th className="num" style={{textAlign:'right'}}>Costo unit.</th><th className="num" style={{textAlign:'right'}}>Precio</th><th className="num" style={{textAlign:'right'}}>Margen</th><th className="num" style={{textAlign:'right'}}>Vendidas</th><th className="num" style={{textAlign:'right'}}>Ingresos</th><th className="num" style={{textAlign:'right'}}>Utilidad</th></tr></thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td><span className="swatch" style={{ background: p.color }}></span>{p.nombre}<div className="muted num" style={{ fontSize: 11 }}>{p.id}</div></td>
                <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(p.costoUnit)}</td>
                <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(p.precio)}</td>
                <td className="num" style={{ textAlign: 'right', color: p.margenPct > 30 ? 'var(--good)' : p.margenPct > 15 ? 'var(--warn)' : 'var(--bad)', fontWeight: 600 }}>{p.margenPct.toFixed(1)}%</td>
                <td className="num" style={{ textAlign: 'right' }}>{p.vendidas}</td>
                <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(p.ingresos)}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.utilidad)}</td>
              </tr>
            ))}
            {productos.length === 0 && <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin productos</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Predicción de quiebres ---
function PrediccionQuiebres({ data }) {
  const { formatNum, Tabs } = window.SH;
  const [dias, setDias] = useStateRE(30);
  const pred = window.UT.predecirQuiebres(data.materias, data.movimientos, dias);
  const enRiesgo = pred.filter((p) => p.diasRestantes < 30 && p.consumoDiario > 0).length;
  return (
    <>
      <div className="row mt-12" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="muted" style={{ fontSize: 13 }}>Basado en el consumo promedio diario de los últimos:</div>
        <div className="row gap-8">
          <button className={"btn sm " + (dias === 7 ? 'primary' : '')} onClick={() => setDias(7)}>7 días</button>
          <button className={"btn sm " + (dias === 30 ? 'primary' : '')} onClick={() => setDias(30)}>30 días</button>
          <button className={"btn sm " + (dias === 90 ? 'primary' : '')} onClick={() => setDias(90)}>90 días</button>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: 14 }}>
        <div className="kpi"><div className="label">MP en riesgo</div><div className="val" style={{ color: enRiesgo ? 'var(--bad)' : 'inherit' }}>{enRiesgo}</div><div className="trend">Quiebre en menos de 30 días</div></div>
        <div className="kpi"><div className="label">MP estables</div><div className="val">{pred.filter((p) => p.diasRestantes >= 30).length}</div><div className="trend">Cobertura larga</div></div>
        <div className="kpi"><div className="label">MP sin movimientos</div><div className="val">{pred.filter((p) => p.consumoDiario === 0).length}</div><div className="trend">Sin consumo registrado</div></div>
      </div>
      <div className="card">
        <table className="t">
          <thead><tr><th>Materia prima</th><th className="num" style={{textAlign:'right'}}>Stock</th><th className="num" style={{textAlign:'right'}}>Consumo/día</th><th className="num" style={{textAlign:'right'}}>Días restantes</th><th>Predicción</th></tr></thead>
          <tbody>
            {pred.map((p) => {
              const dr = p.diasRestantes;
              const tone = dr < 7 ? 'bad' : dr < 30 ? 'warn' : 'good';
              const dias = isFinite(dr) ? Math.round(dr) : '∞';
              return (
                <tr key={p.id}>
                  <td>{p.nombre}<div className="muted num" style={{ fontSize: 11 }}>{p.id}</div></td>
                  <td className="num" style={{ textAlign: 'right' }}>{p.stock} {p.unidad}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{p.consumoDiario > 0 ? p.consumoDiario.toFixed(2) + ' ' + p.unidad : '—'}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{p.consumoDiario === 0 ? '∞' : dias}</td>
                  <td>
                    {p.consumoDiario === 0
                      ? <span className="pill">Sin consumo</span>
                      : <span className={"pill " + tone}><span className="dot"></span>{dr < 7 ? 'Crítico' : dr < 30 ? 'Atender' : 'Estable'}</span>}
                  </td>
                </tr>
              );
            })}
            {pred.length === 0 && <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin MP para analizar</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Exportar reporte ---
function exportarReporte(tab, data, fmt = 'xls') {
  let rows = [];
  let name = 'reporte';
  if (tab === 'inventario') {
    rows = data.materias.map((m) => ({ Codigo: m.id, Nombre: m.nombre, Categoria: m.categoria, Stock: m.stock, Minimo: m.minimo, Costo: m.costo, Valor: m.stock * m.costo }));
    name = 'inventario-mp';
  } else if (tab === 'movimientos') {
    rows = data.movimientos.map((m) => ({ Fecha: m.fecha, Tipo: m.tipo, Item: m.item, Cantidad: m.cant, Documento: m.doc, Usuario: m.user }));
    name = 'movimientos';
  } else if (tab === 'consumo') {
    rows = data.movimientos.filter((m) => m.tipo === 'Salida' && m.item.startsWith('MP'))
      .map((m) => ({ Fecha: m.fecha, MP: m.item, Consumido: Math.abs(m.cant), Documento: m.doc }));
    name = 'consumo-mp';
  } else if (tab === 'alertas') {
    rows = [...data.materias.filter((m) => m.stock < m.minimo).map((m) => ({ Tipo: 'MP', Codigo: m.id, Nombre: m.nombre, Stock: m.stock, Minimo: m.minimo, Deficit: m.minimo - m.stock })),
            ...data.productos.filter((p) => p.stock < p.minimo).map((p) => ({ Tipo: 'PT', Codigo: p.id, Nombre: p.nombre, Stock: p.stock, Minimo: p.minimo, Deficit: p.minimo - p.stock }))];
    name = 'alertas-stock';
  } else if (tab === 'abc') {
    const items = [...data.materias.map((m) => ({ ...m, _kind: 'MP' })), ...data.productos.map((p) => ({ ...p, _kind: 'PT' }))];
    rows = window.UT.clasificarABC(items, (x) => x._kind === 'MP' ? x.stock * x.costo : x.stock * x.precio)
      .map((x) => ({ Clase: x._clase, Tipo: x._kind, Codigo: x.id, Nombre: x.nombre, Valor: x._valor, Pct: x._pct.toFixed(2), Acum: x._acum.toFixed(2) }));
    name = 'analisis-abc';
  } else if (tab === 'prediccion') {
    rows = window.UT.predecirQuiebres(data.materias, data.movimientos, 30)
      .map((p) => ({ Codigo: p.id, Nombre: p.nombre, Stock: p.stock, ConsumoDiario: p.consumoDiario.toFixed(2), DiasRestantes: isFinite(p.diasRestantes) ? Math.round(p.diasRestantes) : 'inf' }));
    name = 'prediccion-quiebres';
  } else if (tab === 'rentab') {
    rows = data.productos.map((p) => {
      const receta = data.recetas[p.id] || [];
      const costoUnit = receta.reduce((a, r) => { const mp = data.materias.find((m) => m.id === r.mp); return a + (mp ? mp.costo * r.cant : 0); }, 0);
      const vendidas = data.movimientos.filter((m) => m.item === p.id && m.tipo === 'Salida').reduce((a, m) => a + Math.abs(m.cant), 0);
      return { Codigo: p.id, Nombre: p.nombre, Costo: costoUnit, Precio: p.precio, Margen: p.precio ? ((p.precio - costoUnit) / p.precio * 100).toFixed(1) : 0, Vendidas: vendidas, Utilidad: vendidas * (p.precio - costoUnit) };
    });
    name = 'rentabilidad';
  }
  const fn = fmt === 'csv' ? window.UT.exportCSV : window.UT.exportXLS;
  fn(name + '-' + Date.now() + (fmt === 'csv' ? '.csv' : '.xls'), rows);
}

window.Reportes = Reportes;
