// Módulo Órdenes de Compra (OC) — genera OC a proveedores basadas en MP bajo mínimo
const { useState: useStateOC, useMemo: useMemoOC } = React;

function Compras({ data, setData, toast }) {
  const { formatCurrency, formatNum, Modal, Empty, Tabs, Confirm } = window.SH;
  const [tab, setTab] = useStateOC('sugerencias');
  const [openNew, setOpenNew] = useStateOC(false);
  const [selProv, setSelProv] = useStateOC('');
  const [items, setItems] = useStateOC({}); // { mp_id: { cant, costo } }
  const [verOC, setVerOC] = useStateOC(null);

  const ocList = data.ordenesCompra || [];
  const proveedores = data.proveedores || [];

  // MPs bajo mínimo — sugerencias automáticas
  const sugerencias = useMemoOC(() => {
    const grupos = {};
    data.materias.filter((m) => m.stock < m.minimo).forEach((m) => {
      const prov = m.proveedor || 'Sin proveedor';
      if (!grupos[prov]) grupos[prov] = { proveedor: prov, items: [], total: 0 };
      const cantSugerida = Math.max(m.minimo * 2 - m.stock, m.minimo);
      const subtotal = cantSugerida * m.costo;
      grupos[prov].items.push({ ...m, cantSugerida, subtotal });
      grupos[prov].total += subtotal;
    });
    return Object.values(grupos);
  }, [data.materias]);

  const generarOCDesdeSugerencia = (grupo) => {
    const prov = proveedores.find((p) => p.nombre === grupo.proveedor);
    const items = {};
    grupo.items.forEach((it) => {
      items[it.id] = { cant: it.cantSugerida, costo: it.costo };
    });
    setSelProv(prov?.id || '');
    setItems(items);
    setOpenNew(true);
  };

  const guardarOC = () => {
    if (!selProv) { toast('Selecciona proveedor', { icon: 'alert' }); return; }
    if (Object.keys(items).length === 0) { toast('Agrega al menos un ítem', { icon: 'alert' }); return; }
    const id = 'OC-' + String(2026000 + ocList.length + 1);
    const prov = proveedores.find((p) => p.id === selProv);
    const detalle = Object.entries(items).map(([mp, x]) => {
      const m = data.materias.find((mm) => mm.id === mp);
      return { mp, nombre: m?.nombre, cant: +x.cant, costoUnit: +x.costo, subtotal: +x.cant * +x.costo, unidad: m?.unidad };
    });
    const total = detalle.reduce((a, d) => a + d.subtotal, 0);
    const fechaHora = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    const oc = {
      id,
      fecha: new Date().toLocaleDateString('es-CO'),
      fechaHora,
      proveedor: selProv,
      proveedorNombre: prov?.nombre || 'Sin proveedor',
      detalle, total, estado: 'Emitida',
      origen: 'Manual',
      procesoFechas: { compra: fechaHora }
    };
    setData((d) => ({ ...d, ordenesCompra: [oc, ...(d.ordenesCompra || [])] }));
    window.UT.logAuditoria(setData, 'Creó orden de compra', `${id} · ${prov?.nombre} · ${formatCurrency(total)}`);
    toast('Orden de compra ' + id + ' generada');
    setItems({});
    setSelProv('');
    setOpenNew(false);
  };

  const marcarRecibida = (oc) => {
    // Aumentar stock de cada MP por su cantidad de la OC
    setData((d) => {
      let materias = d.materias;
      const movs = [];
      const fecha = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
      oc.detalle.forEach((det) => {
        materias = materias.map((m) => m.id === det.mp ? { ...m, stock: m.stock + det.cant } : m);
        movs.push({ fecha, tipo: 'Entrada', item: det.mp, cant: det.cant, doc: oc.id, user: 'gerente' });
      });
      const ordenesCompra = d.ordenesCompra.map((x) => x.id === oc.id ? { ...x, estado: 'Recibida', fechaRecibida: fecha, procesoFechas: { ...(x.procesoFechas || {}), recibida: fecha } } : x);
      return { ...d, materias, ordenesCompra, movimientos: [...movs, ...d.movimientos] };
    });
    window.UT.logAuditoria(setData, 'Recibió OC', `${oc.id} · ${oc.detalle.length} ítems`);
    toast('OC ' + oc.id + ' recibida y stock actualizado');
  };

  const totalSug = sugerencias.reduce((a, g) => a + g.total, 0);
  const itemsSug = sugerencias.reduce((a, g) => a + g.items.length, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Órdenes de compra</h1>
          <p className="page-sub">Solicitudes formales a proveedores para reponer materias primas. El sistema sugiere automáticamente OCs basadas en items bajo mínimo.</p>
        </div>
        <div className="row gap-8">
          <button className="btn accent" onClick={() => { setItems({}); setSelProv(''); setOpenNew(true); }}><Icon name="plus" size={14} /> Nueva OC manual</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">OCs emitidas</div><div className="val">{ocList.filter((o)=>o.estado==='Emitida').length}</div><div className="trend">Pendientes de recibir</div></div>
        <div className="kpi"><div className="label">OCs recibidas</div><div className="val">{ocList.filter((o)=>o.estado==='Recibida').length}</div><div className="trend">Histórico</div></div>
        <div className="kpi"><div className="label">Sugerencias activas</div><div className="val" style={{ color: itemsSug ? 'var(--bad)' : 'inherit' }}>{itemsSug}</div><div className="trend">MP bajo mínimo</div></div>
        <div className="kpi"><div className="label">Compra sugerida</div><div className="val" style={{ fontSize: 22 }}>{formatCurrency(totalSug)}</div><div className="trend">Reposición completa</div></div>
      </div>

      <Tabs items={[
        { value: 'sugerencias', label: 'Sugerencias', count: sugerencias.length },
        { value: 'emitidas',    label: 'OCs emitidas', count: ocList.length }
      ]} value={tab} onChange={setTab} />

      {tab === 'sugerencias' && (
        sugerencias.length === 0
          ? <div className="card"><div className="card-body"><Empty title="No hay sugerencias" sub="Todas las materias primas están por encima del mínimo." icon="check" /></div></div>
          : <div className="col gap-16">
              {sugerencias.map((g, i) => (
                <div className="card" key={i}>
                  <div className="card-head">
                    <h3>{g.proveedor}</h3>
                    <span className="meta">{g.items.length} ítems bajo mínimo</span>
                    <div style={{ flex: 1 }}></div>
                    <span className="num" style={{ fontWeight: 600 }}>{formatCurrency(g.total)}</span>
                    <button className="btn accent sm" onClick={() => generarOCDesdeSugerencia(g)}><Icon name="plus" size={12} /> Generar OC</button>
                  </div>
                  <table className="t">
                    <thead><tr><th>MP</th><th>Stock actual</th><th>Mínimo</th><th>Cant. sugerida</th><th>Costo unit.</th><th className="num" style={{textAlign:'right'}}>Subtotal</th></tr></thead>
                    <tbody>
                      {g.items.map((it) => (
                        <tr key={it.id}>
                          <td><div style={{ fontWeight: 500 }}>{it.nombre}</div><div className="muted" style={{ fontSize: 11 }}>{it.id} · {it.categoria}</div></td>
                          <td className="num" style={{ color: 'var(--bad)' }}>{it.stock} {it.unidad}</td>
                          <td className="num muted">{it.minimo} {it.unidad}</td>
                          <td className="num" style={{ fontWeight: 600 }}>{it.cantSugerida} {it.unidad}</td>
                          <td className="num">{formatCurrency(it.costo)}</td>
                          <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
      )}

      {tab === 'emitidas' && (
        <div className="card">
          <div className="card-head"><h3>Histórico de órdenes de compra</h3></div>
          {ocList.length === 0 ? (
            <Empty title="Sin OCs registradas" sub="Las órdenes que emitas aparecerán aquí." icon="materia" />
          ) : (
            <table className="t">
              <thead><tr><th>OC</th><th>Fecha</th><th>Proveedor</th><th className="num" style={{textAlign:'right'}}>Ítems</th><th className="num" style={{textAlign:'right'}}>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {ocList.map((o) => (
                  <tr key={o.id}>
                    <td className="num" style={{ fontWeight: 500 }}>{o.id}</td>
                    <td className="muted num">{o.fechaHora || o.fecha}</td>
                    <td>{o.proveedorNombre}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{o.detalle.length}</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(o.total)}</td>
                    <td><span className={"pill " + (o.estado === 'Recibida' ? 'good' : 'warn')}><span className="dot"></span>{o.estado}</span></td>
                    <td>
                      <div className="row gap-8">
                        <button className="btn sm" onClick={() => setVerOC(o)}><Icon name="eye" size={12} /> Ver</button>
                        <button className="btn sm" onClick={() => imprimirOC(o)} title="PDF"><Icon name="download" size={12} /> PDF</button>
                        {o.estado === 'Emitida' && (
                          <button className="btn sm accent" onClick={() => marcarRecibida(o)}><Icon name="check" size={12} /> Recibir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {openNew && (
        <Modal title="Nueva orden de compra" icon="materia" onClose={() => setOpenNew(false)}
          footer={<><button className="btn" onClick={() => setOpenNew(false)}>Cancelar</button><button className="btn accent" onClick={guardarOC}>Emitir OC</button></>}>
          <div className="field">
            <label>Proveedor</label>
            <select className="select" value={selProv} onChange={(e) => setSelProv(e.target.value)}>
              <option value="">Selecciona…</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>)}
            </select>
          </div>
          <hr className="sep" />
          <div style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Ítems a comprar</div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="t" style={{ fontSize: 12.5 }}>
              <thead><tr><th>Materia prima</th><th>Cantidad</th><th>Costo unit.</th><th className="num" style={{textAlign:'right'}}>Subtotal</th><th></th></tr></thead>
              <tbody>
                {Object.entries(items).map(([mpId, x]) => {
                  const mp = data.materias.find((m) => m.id === mpId);
                  return (
                    <tr key={mpId}>
                      <td>{mp?.nombre}<div className="muted" style={{ fontSize: 11 }}>{mpId} · {mp?.unidad}</div></td>
                      <td><input className="input num" type="number" value={x.cant} onChange={(e) => setItems({ ...items, [mpId]: { ...x, cant: e.target.value } })} style={{ width: 90 }} /></td>
                      <td><input className="input num" type="number" value={x.costo} onChange={(e) => setItems({ ...items, [mpId]: { ...x, costo: e.target.value } })} style={{ width: 110 }} /></td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency((+x.cant || 0) * (+x.costo || 0))}</td>
                      <td><button className="btn sm ghost danger" onClick={() => { const n = { ...items }; delete n[mpId]; setItems(n); }}><Icon name="trash" size={12} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="row mt-12" style={{ alignItems: 'flex-end', gap: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Añadir MP</label>
              <select className="select" onChange={(e) => {
                if (!e.target.value) return;
                const m = data.materias.find((x) => x.id === e.target.value);
                setItems({ ...items, [m.id]: { cant: 1, costo: m.costo } });
                e.target.value = '';
              }}>
                <option value="">Selecciona…</option>
                {data.materias.filter((m) => !items[m.id]).map((m) => <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-16" style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
            <div className="muted">Total OC</div>
            <div className="num" style={{ fontWeight: 600 }}>{formatCurrency(Object.values(items).reduce((a, x) => a + (+x.cant || 0) * (+x.costo || 0), 0))}</div>
          </div>
        </Modal>
      )}

      {verOC && <DetalleOCModal oc={verOC} onClose={() => setVerOC(null)} />}
    </>
  );
}

function DetalleOCModal({ oc, onClose }) {
  const { formatCurrency, Modal } = window.SH;
  return (
    <Modal title={"OC " + oc.id} icon="materia" onClose={onClose}
      footer={<button className="btn accent" onClick={onClose}>Cerrar</button>}>
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="field"><label>Fecha</label><div>{oc.fechaHora || oc.fecha}</div></div>
        <div className="field"><label>Proveedor</label><div>{oc.proveedorNombre}</div></div>
        <div className="field"><label>Estado</label><div><span className={"pill " + (oc.estado === 'Recibida' ? 'good' : 'warn')}><span className="dot"></span>{oc.estado}</span></div></div>
        <div className="field"><label>Total</label><div className="num" style={{ fontWeight: 600 }}>{formatCurrency(oc.total)}</div></div>
      </div>
      <table className="t" style={{ fontSize: 12.5 }}>
        <thead><tr><th>MP</th><th>Cant.</th><th>Costo</th><th className="num" style={{textAlign:'right'}}>Subtotal</th></tr></thead>
        <tbody>
          {oc.detalle.map((d) => (
            <tr key={d.mp}>
              <td>{d.nombre}<div className="muted" style={{ fontSize: 11 }}>{d.mp}</div></td>
              <td className="num">{d.cant} {d.unidad}</td>
              <td className="num">{formatCurrency(d.costoUnit)}</td>
              <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function imprimirOC(oc) {
  const fmt = (n) => '$ ' + Number(n).toLocaleString('es-CO');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${oc.id}</title>
<style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; color: #1c1a16; margin: 0; }
.head { display:flex; justify-content:space-between; padding-bottom:16px; border-bottom:2px solid #1c1a16; margin-bottom:18px; }
.brand { display:flex; gap:12px; align-items:center; }
.mark { width:36px; height:36px; border-radius:8px; background: radial-gradient(circle at 30% 30%, #5b9bd5, #1f3f6b 70%); }
h1 { font-size:18px; margin:0 0 6px; }
table { width:100%; border-collapse:collapse; margin:14px 0; }
th { background:#F3EFE7; padding:8px; text-align:left; border-bottom:1px solid #d6cebd; font-size:11px; }
td { padding:8px; border-bottom:1px solid #e6e0d4; font-size:11.5px; }
.num { font-family: ui-monospace, monospace; text-align:right; }
.tot { background:#faf8f4; font-weight:700; border-top:2px solid #1c1a16; }
.box { border:1px solid #d6cebd; padding:10px 12px; border-radius:6px; background:#faf8f4; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
</style></head><body>
<button onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:10px 16px;background:#B5572D;color:white;border:0;border-radius:6px;font-weight:600;cursor:pointer">Imprimir / PDF</button>
<div class="head">
  <div class="brand"><div class="mark"></div><div><div style="font-weight:700;font-size:16px">PinturaStock</div><div style="font-size:10px;color:#7a7466;text-transform:uppercase;letter-spacing:.06em">Mendoza Pinturas SAS</div></div></div>
  <div style="text-align:right;font-size:11px"><div style="font-weight:700;font-size:14px">Orden de compra</div><div style="font-family:ui-monospace,monospace;font-size:13px">${oc.id}</div><div style="margin-top:4px">${oc.fecha}</div></div>
</div>
<div class="grid">
  <div class="box"><div style="font-size:10px;text-transform:uppercase;color:#7a7466;margin-bottom:4px">Proveedor</div><div style="font-weight:600;font-size:14px">${oc.proveedorNombre}</div></div>
  <div class="box"><div style="font-size:10px;text-transform:uppercase;color:#7a7466;margin-bottom:4px">Estado</div><div style="font-weight:600;font-size:14px">${oc.estado}</div></div>
</div>
<table>
  <thead><tr><th>Código</th><th>Materia prima</th><th class="num">Cantidad</th><th class="num">Costo unit.</th><th class="num">Subtotal</th></tr></thead>
  <tbody>
    ${oc.detalle.map((d) => `<tr><td style="font-family:ui-monospace,monospace">${d.mp}</td><td>${d.nombre}</td><td class="num">${d.cant} ${d.unidad||''}</td><td class="num">${fmt(d.costoUnit)}</td><td class="num">${fmt(d.subtotal)}</td></tr>`).join('')}
    <tr class="tot"><td colspan="4" style="text-align:right">Total</td><td class="num">${fmt(oc.total)}</td></tr>
  </tbody>
</table>
<div style="margin-top:50px;display:grid;grid-template-columns:1fr 1fr;gap:30px">
  <div style="text-align:center"><div style="border-top:1px solid #1c1a16;padding-top:6px;font-size:11px">Solicitante</div><div style="font-size:10px;color:#7a7466;text-transform:uppercase;margin-top:2px">Gerente de Producción</div></div>
  <div style="text-align:center"><div style="border-top:1px solid #1c1a16;padding-top:6px;font-size:11px">Proveedor</div><div style="font-size:10px;color:#7a7466;text-transform:uppercase;margin-top:2px">${oc.proveedorNombre}</div></div>
</div>
<footer style="margin-top:30px;padding-top:10px;border-top:1px dashed #d6cebd;font-size:10px;color:#7a7466">PinturaStock · ${new Date().toLocaleString('es-CO')}</footer>
<script>setTimeout(function(){try{window.print()}catch(e){}},400);</script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

window.Compras = Compras;
