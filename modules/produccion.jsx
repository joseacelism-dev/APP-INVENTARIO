// Módulo Producción
const { useState: useStatePR, useMemo: useMemoPR, useEffect: useEffectPR } = React;

function Produccion({ data, setData, toast, navParams }) {
  const { formatCurrency, formatNum, Modal, Empty, Tabs } = window.SH;
  const firstProd = data.productos[0]?.id || '';
  const [selProd, setSelProd] = useStatePR(navParams?.producto || firstProd);
  const [cant, setCant] = useStatePR(50);
  const [operario, setOperario] = useStatePR('Gerente de Producción');
  const [fecha, setFecha] = useStatePR(new Date().toISOString().slice(0,10));
  const [merma, setMerma] = useStatePR(0);
  const [confirmOpen, setConfirmOpen] = useStatePR(false);
  const [newRec, setNewRec] = useStatePR({ mp: '', cant: 0 });
  const [tab, setTab] = useStatePR('producir');
  const [dragIdx, setDragIdx] = useStatePR(null);
  const [overIdx, setOverIdx] = useStatePR(null);

  const reordenar = (from, to) => {
    if (from === to || from == null || to == null) return;
    setData((d) => {
      const arr = [...d.ordenes];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { ...d, ordenes: arr };
    });
    window.UT.logAuditoria(setData, 'Reordenó órdenes', `posición ${from + 1} → ${to + 1}`);
  };

  useEffectPR(() => {
    if (!selProd && firstProd) setSelProd(firstProd);
  }, [firstProd]);

  useEffectPR(() => { if (navParams?.producto) setSelProd(navParams.producto); }, [navParams]);

  const producto = data.productos.find((p) => p.id === selProd);
  const receta = data.recetas[selProd];

  const requerimientos = useMemoPR(() => {
    if (!receta) return [];
    return receta.map((r) => {
      const mp = data.materias.find((m) => m.id === r.mp);
      const total = r.cant * cant;
      const ok = mp.stock >= total;
      return { ...r, mp_obj: mp, total, ok, faltante: ok ? 0 : total - mp.stock };
    });
  }, [receta, cant, data.materias]);

  const puedeProducir = requerimientos.length > 0 && requerimientos.every((r) => r.ok);
  const costoEstimado = requerimientos.reduce((a, r) => a + r.mp_obj.costo * r.total, 0);

  const ejecutar = () => {
    if (!puedeProducir) return;
    const nuevaId = 'OP-2026-' + String(40 + data.ordenes.length).padStart(3, '0');
    const loteId = 'LT-' + new Date().getFullYear() + '-' + String(((data.lotes || []).length) + 1).padStart(3, '0');
    const mermaPct = +merma || 0;
    const cantidadEfectiva = Math.floor(cant * (1 - mermaPct / 100));
    setData((d) => {
      const materias = d.materias.map((m) => {
        const req = requerimientos.find((r) => r.mp === m.id);
        return req ? { ...m, stock: m.stock - req.total } : m;
      });
      const orden = { id: nuevaId, producto: selProd, cantidad: cantidadEfectiva, cantidadPlan: cant, mermaPct, lote: loteId, estado: 'En proceso', fecha, operario };
      const lote = { id: loteId, op: nuevaId, producto: selProd, cantidad: cantidadEfectiva, mermaPct, fecha };
      const fechaHora = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
      const mpMovs = requerimientos.map((r) => ({
        fecha: fechaHora, tipo: 'Salida', item: r.mp, cant: -r.total, doc: nuevaId, user: 'operario', lote: loteId
      }));
      return { ...d, materias, ordenes: [orden, ...d.ordenes], lotes: [lote, ...(d.lotes || [])], movimientos: [...mpMovs, ...d.movimientos] };
    });
    window.UT.logAuditoria(setData, 'Ejecutó producción', `${nuevaId} · ${cantidadEfectiva} u (lote ${loteId})`);
    setConfirmOpen(false);
    toast(`Orden ${nuevaId} en proceso · lote ${loteId} · registra entrada en Movimientos`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Producción</h1>
          <p className="page-sub">Define la cantidad de pintura a fabricar. El sistema calcula automáticamente las materias primas necesarias y las descuenta del inventario.</p>
        </div>
        <div className="row gap-8">
          <button className="btn"><Icon name="download" size={14} /> Histórico</button>
        </div>
      </div>

      <Tabs items={[
        { value: 'producir', label: 'Calculadora de producción' },
        { value: 'inversa',  label: '¿Cuánto puedo producir?' },
        { value: 'lotes',    label: 'Lotes', count: (data.lotes||[]).length }
      ]} value={tab} onChange={setTab} />

      {tab === 'inversa' && <CalculadoraInversa data={data} />}
      {tab === 'lotes' && <ListadoLotes data={data} />}
      {tab === 'producir' && <>

      <div className="grid-12-8">
        <div className="card">
          <div className="card-head">
            <Icon name="calc" size={16} style={{ color: 'var(--accent)' }} />
            <h3>Calculadora de producción</h3>
            <span className="meta">Define los parámetros de la orden</span>
          </div>
          <div className="card-body">
            {data.productos.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--ink-3)' }}>
                <Icon name="flask" size={28} />
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 8 }}>Sin productos terminados</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Crea productos en el módulo "Productos terminados" para poder fabricarlos aquí.</div>
              </div>
            ) : (<>
            <div className="grid-2">
              <div className="field">
                <label>Producto a fabricar</label>
                <select className="select" value={selProd} onChange={(e) => setSelProd(e.target.value)}>
                  {data.productos.map((p) => {
                    const r = data.recetas[p.id];
                    const tag = !r ? ' · sin receta' : (r.length === 0 ? ' · receta vacía' : '');
                    return <option key={p.id} value={p.id}>{p.id} — {p.nombre}{tag}</option>;
                  })}
                </select>
              </div>
              <div className="field">
                <label>Cantidad a producir ({producto?.presentacion})</label>
                <input className="input num" type="number" min="1" value={cant} onChange={(e) => setCant(+e.target.value || 0)} />
              </div>
              <div className="field">
                <label>Fecha de producción</label>
                <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="field">
                <label>Operario responsable</label>
                <input className="input" value={operario} onChange={(e) => setOperario(e.target.value)} placeholder="Nombre del responsable" />
              </div>
              <div className="field">
                <label>Merma estimada (%)</label>
                <input className="input num" type="number" min="0" max="50" step="0.5" value={merma} onChange={(e) => setMerma(e.target.value)} placeholder="0" />
              </div>
            </div>

            <hr className="sep" />

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Requerimiento de materias primas</div>
              <span className="muted" style={{ fontSize: 12 }}>Receta {selProd} × {cant}</span>
            </div>

            {receta && receta.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Composición de la fórmula</div>
                <window.VIZ.RecipeBlend receta={receta} materias={data.materias} height={18} />
                <div className="row gap-12" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                  {receta.map((r, i) => {
                    const mp = data.materias.find((m) => m.id === r.mp);
                    const palette = ['oklch(0.52 0.13 250)', 'oklch(0.55 0.11 210)', 'oklch(0.48 0.14 270)', 'oklch(0.60 0.10 230)', 'oklch(0.45 0.13 290)', 'oklch(0.58 0.12 195)', 'oklch(0.40 0.12 255)'];
                    return (
                      <span key={r.mp} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-2)' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: palette[i % palette.length] }}></span>
                        {mp?.nombre || r.mp}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {receta && receta.length > 0 ? (
              <table className="t">
                <thead><tr><th>Materia prima</th><th>Por unidad</th><th>Necesario</th><th>Disponible</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {requerimientos.map((r) => (
                    <tr key={r.mp}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.mp_obj.nombre}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{r.mp} · {r.mp_obj.categoria}</div>
                      </td>
                      <td className="num muted">{r.cant} {r.mp_obj.unidad}</td>
                      <td className="num" style={{ fontWeight: 500 }}>{r.total.toFixed(2)} {r.mp_obj.unidad}</td>
                      <td className="num">{formatNum(r.mp_obj.stock)} {r.mp_obj.unidad}</td>
                      <td>
                        {r.ok ? <span className="pill good"><span className="dot"></span>Disponible</span>
                              : <span className="pill bad"><span className="dot"></span>Falta {r.faltante.toFixed(2)} {r.mp_obj.unidad}</span>}
                      </td>
                      <td>
                        <button className="btn ghost sm" title="Eliminar de la receta" onClick={() => {
                          setData((d) => ({ ...d, recetas: { ...d.recetas, [selProd]: d.recetas[selProd].filter((x) => x.mp !== r.mp) } }));
                          toast('Materia prima removida de la receta');
                        }}><Icon name="trash" size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 18, background: 'var(--bg-2)', borderRadius: 8, border: '1px dashed var(--line-2)', textAlign: 'center', color: 'var(--ink-3)' }}>
                <Icon name="flask" size={22} />
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 6 }}>Este producto aún no tiene receta</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Agrega las materias primas y cantidades por unidad de {producto?.presentacion}.</div>
              </div>
            )}

            {receta && (
              <div className="mt-12" style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6 }}>
                <div className="row" style={{ alignItems: 'flex-end', gap: 10 }}>
                  <div className="field" style={{ flex: 2 }}>
                    <label>Agregar materia prima</label>
                    <select className="select" value={newRec.mp} onChange={(e) => setNewRec({ ...newRec, mp: e.target.value })}>
                      <option value="">Selecciona…</option>
                      {data.materias.filter((m) => !receta.find((r) => r.mp === m.id)).map((m) => (
                        <option key={m.id} value={m.id}>{m.id} — {m.nombre} ({m.unidad})</option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Cantidad por unidad</label>
                    <input className="input num" type="number" step="0.01" value={newRec.cant} onChange={(e) => setNewRec({ ...newRec, cant: e.target.value })} placeholder="0.00" />
                  </div>
                  <button className="btn accent" onClick={() => {
                    if (!newRec.mp || !+newRec.cant) { toast('Selecciona MP y cantidad', { icon: 'alert' }); return; }
                    setData((d) => ({ ...d, recetas: { ...d.recetas, [selProd]: [...(d.recetas[selProd] || []), { mp: newRec.mp, cant: +newRec.cant }] } }));
                    setNewRec({ mp: '', cant: 0 });
                    toast('Materia prima añadida a la receta');
                  }}><Icon name="plus" size={14} /> Añadir</button>
                </div>
              </div>
            )}

            <div className="row mt-16" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div className="row gap-16">
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Costo materias primas</div>
                  <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(costoEstimado)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Costo unitario</div>
                  <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(cant ? costoEstimado / cant : 0)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Margen estimado</div>
                  <div className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--good)' }}>
                    {producto && cant ? Math.round((1 - (costoEstimado / cant) / producto.precio) * 100) : 0}%
                  </div>
                </div>
              </div>
              <button
                className="btn accent"
                disabled={!puedeProducir}
                onClick={() => setConfirmOpen(true)}
                style={{ padding: '10px 18px', fontSize: 14, opacity: puedeProducir ? 1 : 0.45 }}>
                <Icon name="produccion" size={14} /> Ejecutar producción
              </button>
            </div>
            {!puedeProducir && receta && (
              <div className="mt-12" style={{ padding: 10, background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 13 }}>
                <Icon name="alert" size={14} /> No hay suficientes materias primas para ejecutar esta producción. Reponer los items faltantes.
              </div>
            )}
            </>)}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Vista previa</h3>
            <span className="meta">{producto?.id}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {producto ? (<>
            <div style={{ height: 160, background: producto.color, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 12, left: 16, color: 'rgba(255,255,255,.9)', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{producto.nombre}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{producto.presentacion} · {producto.color.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Stock actual</span>
                <span className="num">{producto.stock} {producto.presentacion}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">+ Producción</span>
                <span className="num" style={{ color: 'var(--good)' }}>+ {cant}</span>
              </div>
              <hr className="sep" style={{ margin: '4px 0' }} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Stock proyectado</span>
                <span className="num" style={{ fontWeight: 600 }}>{producto.stock + cant}</span>
              </div>
            </div>
            </>) : (
              <div style={{ padding: 24, color: 'var(--ink-3)', textAlign: 'center', fontSize: 13 }}>Sin producto seleccionado</div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-head">
          <h3>Órdenes de producción</h3>
          <span className="meta">Arrastra las filas para reordenar prioridad</span>
        </div>
        <table className="t">
          <thead><tr><th style={{ width: 1 }}></th><th>OP</th><th>Producto</th><th>Cantidad</th><th>Lote</th><th>Fecha</th><th>Operario</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {data.ordenes.map((o, idx) => {
              const p = data.productos.find((x) => x.id === o.producto);
              const tone = o.estado === 'Completada' ? 'good' : o.estado === 'En proceso' ? 'info' : 'warn';
              return (
                <tr key={o.id}
                  className={"drag-row" + (dragIdx === idx ? ' dragging' : '') + (overIdx === idx && dragIdx !== idx ? ' drag-over-top' : '')}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                  onDragEnd={() => { reordenar(dragIdx, overIdx); setDragIdx(null); setOverIdx(null); }}
                  onDrop={(e) => { e.preventDefault(); reordenar(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}>
                  <td style={{ color: 'var(--ink-4)', cursor: 'grab' }} title="Arrastrar"><Icon name="filter" size={13} /></td>
                  <td className="num" style={{ fontWeight: 500 }}>{o.id}</td>
                  <td><span className="swatch" style={{ background: p?.color }}></span>{p?.nombre}</td>
                  <td className="num">{o.cantidad} {p?.presentacion}{o.mermaPct ? <span className="muted" style={{ fontSize: 10 }}> ({o.mermaPct}% merma)</span> : null}</td>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{o.lote || '—'}</td>
                  <td className="num muted">{o.fecha}</td>
                  <td>{o.operario}</td>
                  <td><span className={"pill " + tone}><span className="dot"></span>{o.estado}</span></td>
                  <td>
                    <button className="btn sm" onClick={() => generarPDFOrden(o, data)} title="Descargar PDF">
                      <Icon name="download" size={12} /> PDF
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.ordenes.length === 0 && (
              <tr><td colSpan="9" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>No hay órdenes registradas todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>}


      {confirmOpen && (
        <Modal title="Confirmar producción" icon="produccion" onClose={() => setConfirmOpen(false)}
          footer={<><button className="btn" onClick={() => setConfirmOpen(false)}>Cancelar</button><button className="btn accent" onClick={ejecutar}>Ejecutar y descontar</button></>}>
          <div style={{ fontSize: 14 }}>Se fabricarán <span className="num" style={{ fontWeight: 600 }}>{cant} {producto?.presentacion}</span> de <span style={{ fontWeight: 600 }}>{producto?.nombre}</span>.</div>
          <div className="muted mt-12" style={{ fontSize: 13 }}>Las {requerimientos.length} materias primas serán descontadas automáticamente del inventario. La orden quedará registrada como <strong>En proceso</strong>; el stock del producto se sumará al registrar la entrada en Movimientos vinculándola a esta orden.</div>
          <div className="mt-16" style={{ padding: 12, background: 'var(--accent-bg)', borderRadius: 6 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Costo total</span><span className="num" style={{ fontWeight: 600 }}>{formatCurrency(costoEstimado)}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Operario</span><span>{operario}</span></div>
          </div>
        </Modal>
      )}
    </>
  );
}

window.Produccion = Produccion;

// --- Calculadora inversa: cuánto se puede producir con el stock actual ---
function CalculadoraInversa({ data }) {
  const { formatCurrency, formatNum } = window.SH;
  const productos = data.productos;
  const resultados = productos.map((p) => {
    const receta = data.recetas[p.id] || [];
    if (receta.length === 0) return { ...p, maxProducible: 0, limitante: null, valorPosible: 0 };
    let maxProducible = Infinity;
    let limitante = null;
    receta.forEach((r) => {
      const mp = data.materias.find((m) => m.id === r.mp);
      if (!mp || r.cant <= 0) { maxProducible = 0; limitante = mp || null; return; }
      const posibles = Math.floor(mp.stock / r.cant);
      if (posibles < maxProducible) { maxProducible = posibles; limitante = mp; }
    });
    if (maxProducible === Infinity) maxProducible = 0;
    return { ...p, maxProducible, limitante, valorPosible: maxProducible * p.precio };
  }).sort((a, b) => b.maxProducible - a.maxProducible);

  const totalUds = resultados.reduce((a, r) => a + r.maxProducible, 0);
  const totalValor = resultados.reduce((a, r) => a + r.valorPosible, 0);

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi"><div className="label">Productos analizados</div><div className="val">{resultados.length}</div><div className="trend">Con receta definida</div></div>
        <div className="kpi"><div className="label">Unidades posibles</div><div className="val">{formatNum(totalUds)}</div><div className="trend">Sumando todos los SKUs</div></div>
        <div className="kpi"><div className="label">Valor posible</div><div className="val" style={{ fontSize: 22 }}>{formatCurrency(totalValor)}</div><div className="trend">A precio de venta</div></div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>¿Cuánto puedo producir con el stock actual?</h3>
          <span className="meta">El sistema calcula el máximo de cada producto antes de quedarse sin alguna MP</span>
        </div>
        <table className="t">
          <thead><tr><th>Producto</th><th>Stock actual PT</th><th className="num" style={{textAlign:'right'}}>Máximo producible</th><th>MP limitante</th><th className="num" style={{textAlign:'right'}}>Valor posible</th></tr></thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.id}>
                <td><span className="swatch" style={{ background: r.color }}></span>{r.nombre}<div className="muted num" style={{ fontSize: 11 }}>{r.id} · {r.presentacion}</div></td>
                <td className="num">{r.stock}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 15, color: r.maxProducible > 0 ? 'var(--good)' : 'var(--bad)' }}>{r.maxProducible}</td>
                <td>{r.limitante ? (<><div className="muted" style={{ fontSize: 12 }}>{r.limitante.nombre}</div><div className="num" style={{ fontSize: 11 }}>{r.limitante.stock} {r.limitante.unidad} en stock</div></>) : <span className="muted">Sin receta</span>}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(r.valorPosible)}</td>
              </tr>
            ))}
            {resultados.length === 0 && (<tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin productos definidos</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Listado de lotes ---
function ListadoLotes({ data }) {
  const lotes = data.lotes || [];
  return (
    <div className="card">
      <div className="card-head"><h3>Trazabilidad por lotes</h3><span className="meta">Cada producción genera un lote rastreable</span></div>
      {lotes.length === 0 ? (
        <div style={{ padding: 36, textAlign: 'center', color: 'var(--ink-3)' }}>
          <Icon name="box" size={24} />
          <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 8 }}>Sin lotes</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Los lotes se generan automáticamente al ejecutar una producción.</div>
        </div>
      ) : (
        <table className="t">
          <thead><tr><th>Lote</th><th>OP</th><th>Producto</th><th className="num" style={{textAlign:'right'}}>Cantidad</th><th className="num" style={{textAlign:'right'}}>Merma %</th><th>Fecha</th></tr></thead>
          <tbody>
            {lotes.map((l) => {
              const p = data.productos.find((x) => x.id === l.producto);
              return (
                <tr key={l.id}>
                  <td className="num" style={{ fontWeight: 600 }}>{l.id}</td>
                  <td className="num muted">{l.op}</td>
                  <td><span className="swatch" style={{ background: p?.color }}></span>{p?.nombre}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{l.cantidad} {p?.presentacion}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{l.mermaPct || 0}%</td>
                  <td className="muted">{l.fecha}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- Generación de PDF de orden de producción ---
function generarPDFOrden(orden, data) {
  const producto = data.productos.find((p) => p.id === orden.producto);
  const receta = data.recetas[orden.producto] || [];
  const fmtMoney = (n) => '$ ' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const filas = receta.map((r) => {
    const mp = data.materias.find((m) => m.id === r.mp);
    const total = r.cant * orden.cantidad;
    const costo = mp ? mp.costo * total : 0;
    return { mp, cant: r.cant, total, costo };
  });
  const costoTotal = filas.reduce((a, f) => a + f.costo, 0);
  const costoUnit = orden.cantidad ? costoTotal / orden.cantidad : 0;
  const precioVenta = producto ? producto.precio : 0;
  const margenPct = precioVenta ? Math.round((1 - costoUnit / precioVenta) * 100) : 0;
  const fechaImpresion = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

  const tone = orden.estado === 'Completada' ? '#3A8A5B' : orden.estado === 'En proceso' ? '#3266A1' : '#C99320';

  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<title>Orden ${orden.id} — PinturaStock</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1c1a16; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #1c1a16; margin-bottom: 24px; }
  .brand { display: flex; gap: 12px; align-items: center; }
  .mark { width: 36px; height: 36px; border-radius: 8px; background: radial-gradient(circle at 30% 30%, #5b9bd5, #1f3f6b 70%); position: relative; }
  .mark::after { content: ""; position: absolute; inset: 0; border-radius: 8px; background: radial-gradient(circle at 70% 75%, #2a7fb8 0 30%, transparent 31%); mix-blend-mode: multiply; opacity: .55; }
  .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
  .brand-sub { font-size: 10px; color: #7a7466; text-transform: uppercase; letter-spacing: .06em; }
  .meta { text-align: right; font-size: 11px; color: #4a463d; }
  .meta strong { color: #1c1a16; }
  h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: -.02em; }
  .lead { color: #4a463d; font-size: 12px; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 600; color: white; background: ${tone}; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
  .box { border: 1px solid #d6cebd; border-radius: 6px; padding: 12px 14px; background: #faf8f4; }
  .box h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #7a7466; font-weight: 600; }
  .kv { display: grid; grid-template-columns: 130px 1fr; gap: 4px 12px; font-size: 11.5px; }
  .kv dt { color: #7a7466; }
  .kv dd { margin: 0; color: #1c1a16; }
  .swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d6cebd; vertical-align: middle; margin-right: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #f3efe7; padding: 8px 10px; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #4a463d; border-bottom: 1px solid #d6cebd; }
  td { padding: 8px 10px; border-bottom: 1px solid #e6e0d4; font-size: 11.5px; vertical-align: top; }
  td.num { font-family: ui-monospace, "JetBrains Mono", "SF Mono", monospace; text-align: right; }
  tr.total td { background: #faf8f4; font-weight: 700; border-top: 2px solid #1c1a16; border-bottom: 2px solid #1c1a16; }
  .section { margin-bottom: 24px; }
  .section h2 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #1c1a16; padding-bottom: 4px; border-bottom: 1px solid #1c1a16; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 56px; }
  .sig { text-align: center; }
  .sig-line { border-top: 1px solid #1c1a16; padding-top: 6px; font-size: 11px; color: #4a463d; }
  .sig-label { font-size: 10px; color: #7a7466; text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
  footer { margin-top: 40px; padding-top: 12px; border-top: 1px dashed #d6cebd; font-size: 10px; color: #7a7466; display: flex; justify-content: space-between; }
  .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 16px; background: #B5572D; color: white; border: 0; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); font-size: 13px; }
  @media print { .print-btn { display: none; } body { font-size: 11.5px; } }
</style>
</head><body>
  <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>

  <div class="head">
    <div class="brand">
      <div class="mark"></div>
      <div>
        <div class="brand-name">PinturaStock</div>
        <div class="brand-sub">Mendoza Pinturas SAS · v2.4</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Orden de producción</strong></div>
      <div style="font-family: ui-monospace, monospace; font-size: 14px; color: #1c1a16; margin-top: 2px;">${orden.id}</div>
      <div style="margin-top: 6px;">Emitida: ${fechaImpresion}</div>
    </div>
  </div>

  <h1>${producto?.nombre || 'Producto'} <span style="font-size: 14px; color: #7a7466; font-weight: 400;">— ${orden.cantidad} ${producto?.presentacion || 'u'}</span></h1>
  <div class="lead">Documento de control y trazabilidad para la fabricación interna del lote indicado.</div>

  <div class="grid">
    <div class="box">
      <h3>Datos de la orden</h3>
      <dl class="kv">
        <dt>Identificador</dt><dd style="font-family: ui-monospace, monospace;">${orden.id}</dd>
        <dt>Fecha programada</dt><dd>${orden.fecha}</dd>
        <dt>Estado</dt><dd><span class="badge">${orden.estado}</span></dd>
        <dt>Operario asignado</dt><dd>${orden.operario}</dd>
        <dt>Cantidad</dt><dd>${orden.cantidad} ${producto?.presentacion || ''}</dd>
      </dl>
    </div>
    <div class="box">
      <h3>Datos del producto</h3>
      <dl class="kv">
        <dt>Código</dt><dd style="font-family: ui-monospace, monospace;">${producto?.id || '—'}</dd>
        <dt>Nombre</dt><dd>${producto?.nombre || '—'}</dd>
        <dt>Color</dt><dd><span class="swatch" style="background:${producto?.color || '#ccc'}"></span>${(producto?.color || '').toUpperCase()}</dd>
        <dt>Presentación</dt><dd>${producto?.presentacion || '—'}</dd>
        <dt>Precio unitario</dt><dd style="font-family: ui-monospace, monospace;">${fmtMoney(precioVenta)}</dd>
      </dl>
    </div>
  </div>

  <div class="section">
    <h2>Materias primas consumidas</h2>
    <table>
      <thead><tr>
        <th style="width: 80px;">Código</th>
        <th>Materia prima</th>
        <th style="width: 90px;">Categoría</th>
        <th style="width: 90px;" class="num">Por unidad</th>
        <th style="width: 90px;" class="num">Total</th>
        <th style="width: 80px;" class="num">Costo unit.</th>
        <th style="width: 90px;" class="num">Subtotal</th>
      </tr></thead>
      <tbody>
        ${filas.length === 0 ? `<tr><td colspan="7" style="text-align:center; color:#7a7466; padding:18px;">Sin receta registrada para este producto.</td></tr>` : filas.map((f) => `
          <tr>
            <td style="font-family: ui-monospace, monospace;">${f.mp?.id || '—'}</td>
            <td><strong>${f.mp?.nombre || '—'}</strong></td>
            <td>${f.mp?.categoria || '—'}</td>
            <td class="num">${f.cant} ${f.mp?.unidad || ''}</td>
            <td class="num"><strong>${f.total.toFixed(2)} ${f.mp?.unidad || ''}</strong></td>
            <td class="num">${fmtMoney(f.mp?.costo || 0)}</td>
            <td class="num"><strong>${fmtMoney(f.costo)}</strong></td>
          </tr>`).join('')}
        ${filas.length > 0 ? `<tr class="total">
          <td colspan="6" style="text-align:right;">Costo total de materias primas</td>
          <td class="num">${fmtMoney(costoTotal)}</td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Análisis de costos</h2>
    <div class="grid">
      <div class="box">
        <dl class="kv">
          <dt>Costo total MP</dt><dd style="font-family: ui-monospace, monospace;">${fmtMoney(costoTotal)}</dd>
          <dt>Costo por unidad</dt><dd style="font-family: ui-monospace, monospace;">${fmtMoney(costoUnit)}</dd>
          <dt>Precio de venta</dt><dd style="font-family: ui-monospace, monospace;">${fmtMoney(precioVenta)}</dd>
          <dt>Margen estimado</dt><dd style="font-family: ui-monospace, monospace; color: ${margenPct > 0 ? '#3A8A5B' : '#B23E2E'}; font-weight: 600;">${margenPct}%</dd>
        </dl>
      </div>
      <div class="box">
        <dl class="kv">
          <dt>Valor de venta proyectado</dt><dd style="font-family: ui-monospace, monospace;">${fmtMoney(precioVenta * orden.cantidad)}</dd>
          <dt>Utilidad estimada</dt><dd style="font-family: ui-monospace, monospace; color: #3A8A5B; font-weight: 600;">${fmtMoney(precioVenta * orden.cantidad - costoTotal)}</dd>
          <dt>Unidades a fabricar</dt><dd style="font-family: ui-monospace, monospace;">${orden.cantidad}</dd>
          <dt>Tipos de MP utilizadas</dt><dd>${filas.length}</dd>
        </dl>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Observaciones</h2>
    <div style="border: 1px dashed #d6cebd; min-height: 60px; border-radius: 6px; padding: 12px; color: #7a7466; font-size: 11px; font-style: italic;">
      Espacio reservado para anotaciones del proceso productivo, incidencias, ajustes de fórmula y aprobaciones de control de calidad.
    </div>
  </div>

  <div class="signatures">
    <div class="sig"><div class="sig-line">${orden.operario}</div><div class="sig-label">Operario de producción</div></div>
    <div class="sig"><div class="sig-line">&nbsp;</div><div class="sig-label">Encargado de inventario</div></div>
    <div class="sig"><div class="sig-line">&nbsp;</div><div class="sig-label">Control de calidad</div></div>
  </div>

  <footer>
    <span>PinturaStock · Sistema de gestión para producción de pinturas</span>
    <span>Documento generado automáticamente · ${fechaImpresion}</span>
  </footer>

  <script>
    setTimeout(function(){ try { window.print(); } catch(e){} }, 400);
  </script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para descargar el PDF.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

window.generarPDFOrden = generarPDFOrden;
