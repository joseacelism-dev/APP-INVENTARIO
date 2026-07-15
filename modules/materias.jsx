// Módulo Materias Primas — CRUD + QR + histórico costo + categorías dinámicas
const { useState: useStateMP, useMemo: useMemoMP } = React;

function MateriasPrimas({ data, setData, toast }) {
  const { formatCurrency, formatNum, stockStatus, Modal, Empty, StockCell, Chip, Tabs, Confirm } = window.SH;
  const [filter, setFilter] = useStateMP('Todas');
  const [q, setQ] = useStateMP('');
  const [view, setView] = useStateMP('all');
  const [openNew, setOpenNew] = useStateMP(false);
  const [openMov, setOpenMov] = useStateMP(null);
  const [selected, setSelected] = useStateMP(null);
  const [editing, setEditing] = useStateMP(null);
  const [deleting, setDeleting] = useStateMP(null);
  const [viewQR, setViewQR] = useStateMP(null);

  const categoriasDinamicas = (data.categorias || []).filter((c) => c.aplica === 'MP');
  const categoriasFilter = ['Todas', ...categoriasDinamicas.map((c) => c.nombre)];
  const proveedoresOptions = (data.proveedores || []).map((p) => p.nombre);

  const filtered = useMemoMP(() => {
    return data.materias.filter((m) => {
      if (filter !== 'Todas' && m.categoria !== filter) return false;
      if (view === 'low' && m.stock >= m.minimo) return false;
      if (q && !(`${m.id} ${m.nombre} ${m.proveedor}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data.materias, filter, q, view]);

  const lowCount = data.materias.filter((m) => m.stock < m.minimo).length;
  const totalValor = data.materias.reduce((a, m) => a + m.stock * m.costo, 0);

  const blank = { id: '', nombre: '', categoria: categoriasDinamicas[0]?.nombre || 'Pigmento', unidad: 'kg', stock: 0, minimo: 0, costo: 0, proveedor: '' };
  const [form, setForm] = useStateMP(blank);

  const openForEdit = (m) => {
    setEditing(m.id);
    setForm({ id: m.id, nombre: m.nombre, categoria: m.categoria, unidad: m.unidad, stock: m.stock, minimo: m.minimo, costo: m.costo, proveedor: m.proveedor || '' });
    setOpenNew(true);
  };

  const submitNew = () => {
    if (!form.id || !form.nombre) { toast('Completa código y nombre', { icon: 'alert' }); return; }
    if (editing) {
      // log price change if costo changed
      const prev = data.materias.find((m) => m.id === editing);
      if (prev && prev.costo !== +form.costo) {
        window.UT.logPrecio(setData, prev.id, 'Costo MP', prev.costo, +form.costo);
      }
      setData((d) => ({ ...d, materias: d.materias.map((m) => m.id === editing ? { ...form, stock: +form.stock || 0, minimo: +form.minimo || 0, costo: +form.costo || 0 } : m) }));
      window.UT.logAuditoria(setData, 'Editó MP', `${form.nombre} (${form.id})`);
      toast('Materia prima actualizada');
    } else {
      if (data.materias.some((m) => m.id === form.id)) { toast('Ya existe ese código', { icon: 'alert' }); return; }
      setData((d) => ({ ...d, materias: [...d.materias, { ...form, stock: +form.stock || 0, minimo: +form.minimo || 0, costo: +form.costo || 0 }] }));
      window.UT.logAuditoria(setData, 'Creó MP', `${form.nombre} (${form.id})`);
      toast('Materia prima registrada');
    }
    setOpenNew(false);
    setEditing(null);
    setForm(blank);
  };

  const eliminar = () => {
    const m = data.materias.find((x) => x.id === deleting);
    setData((d) => ({ ...d, materias: d.materias.filter((x) => x.id !== deleting) }));
    if (m) window.UT.logAuditoria(setData, 'Eliminó MP', `${m.nombre} (${m.id})`);
    toast('Materia prima eliminada');
    setDeleting(null);
  };

  const [movForm, setMovForm] = useStateMP({ cantidad: 0, doc: '' });
  const submitMov = () => {
    if (!selected) return;
    const cant = +movForm.cantidad;
    if (!cant) { toast('Ingresa una cantidad', { icon: 'alert' }); return; }
    const sign = openMov === 'in' ? 1 : -1;
    if (sign === -1 && cant > selected.stock) { toast('Cantidad excede el stock disponible', { icon: 'alert' }); return; }
    setData((d) => {
      const newStock = Math.max(0, selected.stock + sign * cant);
      const mat = d.materias.map((m) => m.id === selected.id ? { ...m, stock: newStock } : m);
      const mov = {
        fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
        tipo: openMov === 'in' ? 'Entrada' : 'Salida',
        item: selected.id, cant: sign * cant, doc: movForm.doc || (openMov === 'in' ? 'OC-NEW' : 'CONS-NEW'), user: 'gerente'
      };
      return { ...d, materias: mat, movimientos: [mov, ...d.movimientos] };
    });
    window.UT.logAuditoria(setData, (sign === 1 ? 'Entrada' : 'Salida') + ' MP', `${selected.id} · ${cant} ${selected.unidad}`);
    setOpenMov(null); setSelected(null); setMovForm({ cantidad: 0, doc: '' });
    toast((sign === 1 ? 'Entrada' : 'Salida') + ' registrada · ' + cant + ' ' + selected.unidad);
  };

  const exportar = () => {
    window.UT.exportXLS('materias-primas-' + Date.now() + '.xls', data.materias.map((m) => ({
      Codigo: m.id, Nombre: m.nombre, Categoria: m.categoria, Unidad: m.unidad,
      Stock: m.stock, Minimo: m.minimo, Costo: m.costo, Valor: m.stock * m.costo, Proveedor: m.proveedor
    })));
  };

  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">Materias primas</h1>
          <p className="page-sub">Gestiona pigmentos, resinas, solventes, aditivos, envases y etiquetas. Registra entradas, controla salidas y mantén niveles óptimos de stock.</p>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={exportar}><Icon name="download" size={14} /> Exportar Excel</button>
          <button className="btn accent" onClick={() => { setEditing(null); setForm(blank); setOpenNew(true); }}><Icon name="plus" size={14} /> Nueva materia prima</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 22 }}>
        <div className="kpi"><div className="label">Total ítems</div><div className="val">{data.materias.length}</div><div className="trend">{categoriasDinamicas.length} categorías</div></div>
        <div className="kpi"><div className="label">Valor inventario</div><div className="val" style={{ fontSize: 22 }}>{formatCurrency(totalValor)}</div><div className="trend">A costo de adquisición</div></div>
        <div className="kpi"><div className="label">Alertas bajo mínimo</div><div className="val" style={{ color: lowCount ? 'var(--bad)' : 'inherit' }}>{lowCount}</div><div className="trend">{lowCount ? 'Requieren reposición' : 'Todo en orden'}</div></div>
        <div className="kpi"><div className="label">Proveedores activos</div><div className="val">{new Set(data.materias.map((m) => m.proveedor).filter(Boolean)).size}</div><div className="trend">Vinculados</div></div>
      </div>

      <div className="card">
        <div className="card-head" style={{ gap: 12 }}>
          <Tabs value={view} onChange={setView} items={[
            { value: 'all', label: 'Todas', count: data.materias.length },
            { value: 'low', label: 'Bajo mínimo', count: lowCount }
          ]} />
          <div style={{ flex: 1 }}></div>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {categoriasFilter.map((c) => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
          </div>
          <input className="input" placeholder="Buscar código, nombre, proveedor…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        </div>
        <window.SH.FilterChips chips={[
          { key: 'view', active: view === 'low', label: 'Solo bajo mínimo', onClear: () => setView('all') },
          { key: 'cat', active: filter !== 'Todas', label: 'Categoría: ' + filter, onClear: () => setFilter('Todas') },
          { key: 'q', active: !!q, label: 'Búsqueda: "' + q + '"', onClear: () => setQ('') }
        ]} />
        {filtered.length === 0 ? (
          <Empty title="Sin resultados" sub="Ajusta los filtros o agrega una nueva materia prima." icon="materia" />
        ) : (
          <table className="t">
            <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Tendencia</th><th>Costo unit.</th><th>Valor total</th><th>Proveedor</th><th>Estado</th><th style={{ width: 1 }}></th></tr></thead>
            <tbody>
              {filtered.map((m) => {
                const st = stockStatus(m.stock, m.minimo);
                const cat = categoriasDinamicas.find((c) => c.nombre === m.categoria);
                const serie = window.VIZ.serieStock(m, data.movimientos, 12);
                return (
                  <tr key={m.id} className="lift-row">
                    <td className="num" style={{ fontWeight: 500 }} data-hov-kind="MP" data-hov-id={m.id}>{m.id}</td>
                    <td style={{ fontWeight: 500 }}>{m.nombre}</td>
                    <td>
                      <span className="pill" style={cat ? { background: 'transparent', borderColor: cat.color, color: cat.color } : {}}>
                        {cat && <span className="dot" style={{ background: cat.color }}></span>}
                        {m.categoria}
                      </span>
                    </td>
                    <td><StockCell stock={m.stock} minimo={m.minimo} unidad={m.unidad} /></td>
                    <td><window.VIZ.Sparkline points={serie} width={70} height={22} /></td>
                    <td className="num">{formatCurrency(m.costo)}</td>
                    <td className="num" style={{ fontWeight: 500 }}>{formatCurrency(m.stock * m.costo)}</td>
                    <td className="muted">{m.proveedor || '—'}</td>
                    <td><span className={"pill " + st.tone}><span className="dot"></span>{st.label}</span></td>
                    <td>
                      <div className="row gap-8" style={{ flexWrap: 'nowrap' }}>
                        <button className="btn sm" onClick={() => { setSelected(m); setOpenMov('in'); }} title="Entrada"><Icon name="arrowDn" size={12} style={{ color: 'var(--good)' }} /></button>
                        <button className="btn sm" onClick={() => { setSelected(m); setOpenMov('out'); }} title="Salida"><Icon name="arrowUp" size={12} style={{ color: 'var(--bad)' }} /></button>
                        <button className="btn sm ghost" onClick={() => setViewQR(m)} title="Código QR / barras"><Icon name="box" size={12} /></button>
                        <button className="btn sm ghost" onClick={() => openForEdit(m)} title="Editar"><Icon name="edit" size={12} /></button>
                        <button className="btn sm ghost danger" onClick={() => setDeleting(m.id)} title="Eliminar"><Icon name="trash" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openNew && (
        <Modal title={editing ? 'Editar materia prima' : 'Nueva materia prima'} icon="materia" onClose={() => { setOpenNew(false); setEditing(null); }}
          footer={<><button className="btn" onClick={() => { setOpenNew(false); setEditing(null); }}>Cancelar</button><button className="btn accent" onClick={submitNew}>{editing ? 'Actualizar' : 'Registrar'}</button></>}>
          <div className="grid-2">
            <div className="field"><label>Código</label><input className="input" placeholder="MP-013" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!!editing} /></div>
            <div className="field"><label>Nombre</label><input className="input" placeholder="Ej. Pigmento Azul Cobalto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="field"><label>Categoría</label>
              <select className="select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categoriasDinamicas.map((c) => <option key={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Unidad de medida</label>
              <select className="select" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
                {['kg','g','L','ml','u'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label>Stock inicial</label><input className="input num" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="field"><label>Stock mínimo</label><input className="input num" type="number" min="0" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} /></div>
            <div className="field"><label>Costo unitario (COP)</label><input className="input num" type="number" step="1" min="0" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} /></div>
            <div className="field"><label>Proveedor</label>
              {proveedoresOptions.length > 0 ? (
                <select className="select" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })}>
                  <option value="">Sin proveedor</option>
                  {proveedoresOptions.map((p) => <option key={p}>{p}</option>)}
                </select>
              ) : (
                <input className="input" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} placeholder="Nombre del proveedor" />
              )}
            </div>
          </div>
        </Modal>
      )}

      {openMov && selected && (
        <Modal title={(openMov === 'in' ? 'Entrada' : 'Salida') + ' · ' + selected.nombre} icon={openMov === 'in' ? 'arrowDn' : 'arrowUp'}
          onClose={() => { setOpenMov(null); setSelected(null); }}
          footer={<><button className="btn" onClick={() => { setOpenMov(null); setSelected(null); }}>Cancelar</button><button className="btn accent" onClick={submitMov}>Confirmar</button></>}>
          <div className="muted" style={{ marginBottom: 12 }}>Stock actual: <span className="num" style={{ color: 'var(--ink)' }}>{selected.stock} {selected.unidad}</span></div>
          <div className="grid-2">
            <div className="field"><label>Cantidad ({selected.unidad})</label><input className="input num" type="number" min="0" value={movForm.cantidad} onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })} /></div>
            <div className="field"><label>{openMov === 'in' ? 'Orden de compra' : 'Documento'}</label><input className="input" placeholder={openMov === 'in' ? 'OC-1145' : 'CONS-005'} value={movForm.doc} onChange={(e) => setMovForm({ ...movForm, doc: e.target.value })} /></div>
          </div>
          {movForm.cantidad ? (
            <div className="mt-16" style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 6, fontSize: 13 }}>
              Nuevo stock será <span className="num" style={{ fontWeight: 600 }}>{Math.max(0, selected.stock + (openMov === 'in' ? 1 : -1) * +movForm.cantidad)} {selected.unidad}</span>
            </div>
          ) : null}
        </Modal>
      )}

      {viewQR && (
        <Modal title={"Etiqueta · " + viewQR.nombre} icon="box" onClose={() => setViewQR(null)}
          footer={<><button className="btn" onClick={() => setViewQR(null)}>Cerrar</button><button className="btn accent" onClick={() => imprimirEtiqueta(viewQR)}><Icon name="download" size={14} /> Imprimir etiqueta</button></>}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>QR</div>
              <window.UT.QRCodeSVG value={'MP|' + viewQR.id + '|' + viewQR.nombre} size={140} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Código de barras</div>
              <window.UT.BarcodeSVG value={viewQR.id} width={220} height={70} />
            </div>
          </div>
          <hr className="sep" />
          <div className="grid-2">
            <div><div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Código</div><div className="num" style={{ fontWeight: 600 }}>{viewQR.id}</div></div>
            <div><div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Categoría</div><div>{viewQR.categoria}</div></div>
            <div><div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Stock</div><div className="num">{viewQR.stock} {viewQR.unidad}</div></div>
            <div><div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>Proveedor</div><div>{viewQR.proveedor || '—'}</div></div>
          </div>
        </Modal>
      )}

      <Confirm open={!!deleting} danger title="Eliminar materia prima"
        msg="Esta acción no se puede deshacer. El histórico de movimientos se conserva."
        onYes={eliminar} onNo={() => setDeleting(null)} />
    </div>
  );
}

function imprimirEtiqueta(item) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Etiqueta ${item.id}</title>
<style>
@page { size: 80mm 50mm; margin: 4mm; }
body { font-family: -apple-system, sans-serif; font-size: 10px; margin: 0; padding: 4mm; }
.row { display: flex; gap: 8px; align-items: center; }
.title { font-weight: 700; font-size: 11px; }
.id { font-family: ui-monospace, monospace; font-size: 9px; color: #666; }
@media print { button { display: none; } }
</style></head><body>
<button onclick="window.print()" style="position:fixed;top:8px;right:8px;padding:6px 10px;background:#B5572D;color:white;border:0;border-radius:4px;cursor:pointer">Imprimir</button>
<div class="row">
  <div style="flex:1;min-width:0">
    <div class="title">${item.nombre}</div>
    <div class="id">${item.id}${item.categoria ? ' · ' + item.categoria : ''}</div>
    <div style="margin-top:4px;font-size:9px">${item.proveedor || ''}</div>
  </div>
  <div style="text-align:right">
    <div style="font-family:ui-monospace,monospace;font-weight:700;font-size:11px">${item.id}</div>
  </div>
</div>
<script>setTimeout(()=>window.print(),300);</script>
</body></html>`;
  const w = window.open('', '_blank'); if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
}

window.MateriasPrimas = MateriasPrimas;
window.imprimirEtiqueta = imprimirEtiqueta;
