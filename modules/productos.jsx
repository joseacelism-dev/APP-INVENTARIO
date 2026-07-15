// Módulo Productos Terminados
const { useState: useStatePT, useMemo: useMemoPT } = React;

function ProductosTerminados({ data, setData, toast, goTo }) {
  const { formatCurrency, formatNum, stockStatus, Modal, Empty, Chip, Tabs, Confirm } = window.SH;
  const [view, setView] = useStatePT('grid'); // grid | list
  const [q, setQ] = useStatePT('');
  const [filter, setFilter] = useStatePT('Todos');
  const [openSell, setOpenSell] = useStatePT(null);
  const [sellQty, setSellQty] = useStatePT(1);
  const [openNew, setOpenNew] = useStatePT(false);
  const blankP = { id: '', nombre: '', presentacion: '1 gal', color: '#888888', stock: 0, minimo: 0, precio: 0 };
  const [form, setForm] = useStatePT(blankP);
  const [receta, setReceta] = useStatePT([]);
  const [newIng, setNewIng] = useStatePT({ mp: '', cant: 0 });
  const [editing, setEditing] = useStatePT(null);
  const [deleting, setDeleting] = useStatePT(null);
  const [viewQR, setViewQR] = useStatePT(null);
  const [compareSet, setCompareSet] = useStatePT([]);
  const [showCompare, setShowCompare] = useStatePT(false);

  const toggleCompare = (id) => {
    setCompareSet((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : (prev.length >= 3 ? prev : [...prev, id]));
  };

  const presentaciones = ['Todos', '1 gal', '1 L'];
  const filtered = useMemoPT(() => {
    return data.productos.filter((p) => {
      if (filter !== 'Todos' && p.presentacion !== filter) return false;
      if (q && !(`${p.id} ${p.nombre}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data.productos, filter, q]);

  const totalValor = data.productos.reduce((a, p) => a + p.stock * p.precio, 0);
  const totalUds = data.productos.reduce((a, p) => a + p.stock, 0);
  const low = data.productos.filter((p) => p.stock < p.minimo).length;
  const sin = data.productos.filter((p) => p.stock === 0).length;

  const submitSell = () => {
    if (!openSell) return;
    const cant = +sellQty;
    if (!cant || cant > openSell.stock) { toast('Cantidad inválida', { icon: 'alert' }); return; }
    setData((d) => {
      const productos = d.productos.map((p) => p.id === openSell.id ? { ...p, stock: p.stock - cant } : p);
      const mov = {
        fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
        tipo: 'Salida', item: openSell.id, cant: -cant, doc: 'VTA-' + Math.floor(7800 + Math.random() * 200), user: 'vendedor'
      };
      return { ...d, productos, movimientos: [mov, ...d.movimientos] };
    });
    toast(`Salida registrada · ${cant} ${openSell.presentacion}`);
    setOpenSell(null); setSellQty(1);
  };

  const submitNew = () => {
    if (!form.id || !form.nombre) { toast('Completa código y nombre', { icon: 'alert' }); return; }
    if (editing) {
      const prev = data.productos.find((p) => p.id === editing);
      if (prev && prev.precio !== +form.precio) {
        window.UT.logPrecio(setData, prev.id, 'Precio PT', prev.precio, +form.precio);
      }
      setData((d) => ({
        ...d,
        productos: d.productos.map((p) => p.id === editing ? { ...form, stock: +form.stock, minimo: +form.minimo, precio: +form.precio } : p),
        recetas: { ...d.recetas, [editing]: receta }
      }));
      window.UT.logAuditoria(setData, 'Editó producto', `${form.nombre} (${form.id})`);
      toast('Producto actualizado');
    } else {
      if (data.productos.some((p) => p.id === form.id)) { toast('Ya existe ese código', { icon: 'alert' }); return; }
      setData((d) => ({
        ...d,
        productos: [...d.productos, { ...form, stock: +form.stock, minimo: +form.minimo, precio: +form.precio }],
        recetas: { ...d.recetas, [form.id]: receta }
      }));
      window.UT.logAuditoria(setData, 'Creó producto', `${form.nombre} (${form.id})`);
      toast(receta.length > 0 ? `Producto registrado con ${receta.length} MP en su receta` : 'Producto registrado · define su receta en Producción');
    }
    setForm(blankP);
    setReceta([]);
    setNewIng({ mp: '', cant: 0 });
    setOpenNew(false);
    setEditing(null);
  };

  const openForEdit = (p) => {
    setEditing(p.id);
    setForm({ id: p.id, nombre: p.nombre, presentacion: p.presentacion, color: p.color, stock: p.stock, minimo: p.minimo, precio: p.precio });
    setReceta(data.recetas[p.id] || []);
    setOpenNew(true);
  };

  const eliminar = () => {
    const p = data.productos.find((x) => x.id === deleting);
    setData((d) => {
      const recetas = { ...d.recetas }; delete recetas[deleting];
      return { ...d, productos: d.productos.filter((x) => x.id !== deleting), recetas };
    });
    if (p) window.UT.logAuditoria(setData, 'Eliminó producto', `${p.nombre} (${p.id})`);
    toast('Producto eliminado');
    setDeleting(null);
  };

  const exportar = () => {
    window.UT.exportXLS('productos-' + Date.now() + '.xls', data.productos.map((p) => ({
      Codigo: p.id, Nombre: p.nombre, Presentacion: p.presentacion, Color: p.color,
      Stock: p.stock, Minimo: p.minimo, Precio: p.precio, Valor: p.stock * p.precio
    })));
  };

  const addIngrediente = () => {
    if (!newIng.mp || !+newIng.cant) { toast('Selecciona MP y cantidad', { icon: 'alert' }); return; }
    if (receta.find((r) => r.mp === newIng.mp)) { toast('Esa MP ya está en la receta', { icon: 'alert' }); return; }
    setReceta([...receta, { mp: newIng.mp, cant: +newIng.cant }]);
    setNewIng({ mp: '', cant: 0 });
  };

  const removeIngrediente = (mp) => setReceta(receta.filter((r) => r.mp !== mp));

  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">Productos terminados</h1>
          <p className="page-sub">Catálogo de pinturas fabricadas. Consulta existencias, registra salidas por venta o distribución y mantén el stock al día.</p>
        </div>
        <div className="row gap-8">
          {compareSet.length >= 2 && <button className="btn" onClick={() => setShowCompare(true)}><Icon name="reportes" size={14} /> Comparar ({compareSet.length})</button>}
          <button className="btn" onClick={exportar}><Icon name="download" size={14} /> Exportar Excel</button>
          <button className="btn accent" onClick={() => { setEditing(null); setForm(blankP); setReceta([]); setOpenNew(true); }}><Icon name="plus" size={14} /> Nuevo producto</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">SKUs activos</div><div className="val">{data.productos.length}</div><div className="trend">{sin} sin stock</div></div>
        <div className="kpi"><div className="label">Unidades en almacén</div><div className="val">{formatNum(totalUds)}</div><div className="trend">gal + L combinados</div></div>
        <div className="kpi"><div className="label">Valor a precio venta</div><div className="val">{formatCurrency(totalValor)}</div><div className="trend">Stock actual</div></div>
        <div className="kpi"><div className="label">Productos bajo mínimo</div><div className="val" style={{ color: low ? 'var(--bad)' : 'inherit' }}>{low}</div><div className="trend">Programar producción</div></div>
      </div>

      <div className="card">
        <div className="card-head" style={{ gap: 12 }}>
          <div className="row gap-8">
            {presentaciones.map((c) => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
          </div>
          <div style={{ flex: 1 }}></div>
          <input className="input" placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
          <div className="row" style={{ background: 'var(--bg-2)', borderRadius: 6, padding: 2 }}>
            <button className={"btn sm " + (view === 'grid' ? 'primary' : 'ghost')} onClick={() => setView('grid')}>Tarjetas</button>
            <button className={"btn sm " + (view === 'list' ? 'primary' : 'ghost')} onClick={() => setView('list')}>Lista</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty title="Sin productos" sub="Ajusta los filtros." icon="producto" />
        ) : view === 'grid' ? (
          <div className="stagger" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map((p) => {
              const st = stockStatus(p.stock, p.minimo);
              const fillPct = Math.max(6, Math.min(100, Math.round((p.stock / Math.max(p.minimo * 2, 1)) * 100)));
              const serie = window.VIZ.serieStock(p, data.movimientos, 12);
              return (
                <div key={p.id} className="lift-card can-wrap" style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)' }}>
                  <div style={{ height: 150, background: 'var(--bg-2)', position: 'relative', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                    <label style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', borderRadius: 999, padding: '2px 6px', border: '1px solid var(--line)', fontSize: 11, cursor: 'pointer' }} title="Comparar">
                      <input type="checkbox" checked={compareSet.includes(p.id)} onChange={() => toggleCompare(p.id)} style={{ margin: 0 }} />
                      cmp
                    </label>
                    {/* Paint can SVG */}
                    <svg className="can" width="96" height="110" viewBox="0 0 96 110">
                      <defs>
                        <clipPath id={'canclip-' + p.id}>
                          <rect x="16" y="28" width="64" height="72" rx="4" />
                        </clipPath>
                      </defs>
                      {/* can body */}
                      <rect x="16" y="28" width="64" height="72" rx="4" fill="#fff" stroke="var(--line-2)" strokeWidth="1.5" />
                      {/* fill */}
                      <g clipPath={`url(#canclip-${p.id})`}>
                        <rect x="16" y={100 - 0.72 * fillPct} width="64" height={0.72 * fillPct + 4} fill={p.color} />
                        <rect x="16" y={100 - 0.72 * fillPct} width="64" height="4" fill="rgba(255,255,255,.25)" />
                      </g>
                      {/* handle */}
                      <path d="M 24 28 Q 48 6 72 28" fill="none" stroke="var(--line-2)" strokeWidth="2.5" strokeLinecap="round" />
                      {/* rim */}
                      <rect x="13" y="24" width="70" height="8" rx="3" fill="#fff" stroke="var(--line-2)" strokeWidth="1.5" />
                      {/* label band */}
                      <rect x="16" y="54" width="64" height="22" fill="rgba(255,255,255,.82)" />
                      <text x="48" y="69" textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="#1c1a16" fontWeight="600">{p.color.toUpperCase()}</text>
                    </svg>
                    <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', background: 'var(--bg-card)', borderRadius: 999, fontSize: 11, fontFamily: 'var(--mono)', border: '1px solid var(--line)' }} data-hov-kind="PT" data-hov-id={p.id}>{p.id}</div>
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <span className={"pill " + st.tone}><span className="dot"></span>{st.label}</span>
                    </div>
                  </div>
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nombre}</div>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: 12 }}>{p.presentacion}</span>
                      <window.VIZ.Sparkline points={serie} width={64} height={20} />
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 'auto', alignItems: 'flex-end' }}>
                      <div>
                        <div className="muted" style={{ fontSize: 11 }}>Stock</div>
                        <div className="num" style={{ fontWeight: 600, fontSize: 18 }}>{p.stock}<span className="muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>/ mín {p.minimo}</span></div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="muted" style={{ fontSize: 11 }}>Precio</div>
                        <div className="num" style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(p.precio)}</div>
                      </div>
                    </div>
                    <div className="row gap-8" style={{ marginTop: 4 }}>
                      <button className="btn sm" disabled={p.stock === 0} onClick={() => { setOpenSell(p); setSellQty(1); }} style={{ flex: 1, opacity: p.stock === 0 ? 0.5 : 1 }}>Salida</button>
                      <button className="btn sm" title="Producir más" onClick={() => goTo('produccion', { producto: p.id })}><Icon name="produccion" size={13} /></button>
                      <button className="btn sm ghost" title="QR" onClick={() => setViewQR(p)}><Icon name="box" size={13} /></button>
                      <button className="btn sm ghost" title="Editar" onClick={() => openForEdit(p)}><Icon name="edit" size={13} /></button>
                      <button className="btn sm ghost danger" title="Eliminar" onClick={() => setDeleting(p.id)}><Icon name="trash" size={13} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="t">
            <thead><tr><th>Código</th><th>Producto</th><th>Color</th><th>Presentación</th><th>Stock</th><th>Mínimo</th><th>Precio</th><th>Valor total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {filtered.map((p) => {
                const st = stockStatus(p.stock, p.minimo);
                return (
                  <tr key={p.id} className="lift-row">
                    <td className="num" data-hov-kind="PT" data-hov-id={p.id}>{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td><span className="swatch" style={{ background: p.color }}></span><span className="num muted" style={{ fontSize: 12 }}>{p.color.toUpperCase()}</span></td>
                    <td>{p.presentacion}</td>
                    <td className="num" style={{ fontWeight: 500 }}>{p.stock}</td>
                    <td className="num muted">{p.minimo}</td>
                    <td className="num">{formatCurrency(p.precio)}</td>
                    <td className="num">{formatCurrency(p.stock * p.precio)}</td>
                    <td><span className={"pill " + st.tone}><span className="dot"></span>{st.label}</span></td>
                    <td>
                      <div className="row gap-8">
                        <button className="btn sm" disabled={p.stock === 0} onClick={() => { setOpenSell(p); setSellQty(1); }}>Salida</button>
                        <button className="btn sm ghost" onClick={() => setViewQR(p)} title="QR"><Icon name="box" size={12} /></button>
                        <button className="btn sm ghost" onClick={() => openForEdit(p)} title="Editar"><Icon name="edit" size={12} /></button>
                        <button className="btn sm ghost danger" onClick={() => setDeleting(p.id)} title="Eliminar"><Icon name="trash" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openSell && (
        <Modal title={"Registrar salida · " + openSell.nombre} icon="arrowUp" onClose={() => setOpenSell(null)}
          footer={<><button className="btn" onClick={() => setOpenSell(null)}>Cancelar</button><button className="btn accent" onClick={submitSell}>Registrar salida</button></>}>
          <div className="row gap-12" style={{ alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: openSell.color, border: '1px solid var(--line)' }}></div>
            <div>
              <div style={{ fontWeight: 600 }}>{openSell.nombre}</div>
              <div className="muted" style={{ fontSize: 12 }}>{openSell.id} · {openSell.presentacion}</div>
              <div className="muted" style={{ fontSize: 12 }}>Stock disponible: <span className="num" style={{ color: 'var(--ink)' }}>{openSell.stock}</span></div>
            </div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Cantidad</label><input className="input num" type="number" min="1" max={openSell.stock} value={sellQty} onChange={(e) => setSellQty(e.target.value)} /></div>
            <div className="field"><label>Tipo de salida</label>
              <select className="select"><option>Venta</option><option>Distribución</option><option>Muestra</option></select>
            </div>
          </div>
          <div className="mt-16" style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
            <div className="muted">Total a facturar</div>
            <div className="num" style={{ fontWeight: 600 }}>{formatCurrency(+sellQty * openSell.precio)}</div>
          </div>
        </Modal>
      )}

      {openNew && (
        <Modal title={editing ? 'Editar producto terminado' : 'Nuevo producto terminado'} icon="producto" onClose={() => { setOpenNew(false); setEditing(null); }}
          footer={<><button className="btn" onClick={() => { setOpenNew(false); setEditing(null); }}>Cancelar</button><button className="btn accent" onClick={submitNew}>{editing ? 'Actualizar' : 'Registrar producto'}</button></>}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Información del producto</div>
          <div className="grid-2">
            <div className="field"><label>Código</label><input className="input" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="PT-109" disabled={!!editing} /></div>
            <div className="field"><label>Nombre</label><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Esmalte Acrílico Verde" /></div>
            <div className="field"><label>Presentación</label>
              <select className="select" value={form.presentacion} onChange={(e) => setForm({ ...form, presentacion: e.target.value })}>
                <option>1 gal</option><option>1 L</option><option>1/4 gal</option>
              </select>
            </div>
            <div className="field"><label>Color</label>
              <div className="row gap-8">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 40, height: 32, border: '1px solid var(--line)', borderRadius: 4, background: 'transparent' }} />
                <input className="input num" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="field"><label>Stock inicial</label><input className="input num" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="field"><label>Mínimo</label><input className="input num" type="number" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} /></div>
            <div className="field"><label>Precio venta (COP)</label><input className="input num" type="number" step="1" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></div>
          </div>

          <hr className="sep" />

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Receta de producción</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Materias primas necesarias por cada unidad ({form.presentacion}). Aparecerán en Producción.</div>
            </div>
            <span className="pill accent"><span className="dot"></span>{receta.length} MP</span>
          </div>

          {receta.length > 0 && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              <table className="t" style={{ fontSize: 12.5 }}>
                <thead><tr><th>Materia prima</th><th style={{ textAlign: 'right' }}>Cantidad por unidad</th><th></th></tr></thead>
                <tbody>
                  {receta.map((r) => {
                    const mp = data.materias.find((m) => m.id === r.mp);
                    return (
                      <tr key={r.mp}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{mp?.nombre}</div>
                          <div className="muted" style={{ fontSize: 11 }}>{r.mp} · {mp?.categoria}</div>
                        </td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{r.cant} {mp?.unidad}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn ghost sm" onClick={() => removeIngrediente(r.mp)} title="Quitar"><Icon name="trash" size={12} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 6 }}>
            <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
              <div className="field" style={{ flex: 2 }}>
                <label>Materia prima</label>
                <select className="select" value={newIng.mp} onChange={(e) => setNewIng({ ...newIng, mp: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {data.materias.filter((m) => !receta.find((r) => r.mp === m.id)).map((m) => (
                    <option key={m.id} value={m.id}>{m.id} — {m.nombre} ({m.unidad})</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Cantidad por unidad</label>
                <input className="input num" type="number" step="0.01" value={newIng.cant} onChange={(e) => setNewIng({ ...newIng, cant: e.target.value })} placeholder="0.00" />
              </div>
              <button type="button" className="btn" onClick={addIngrediente}><Icon name="plus" size={14} /> Añadir</button>
            </div>
          </div>
        </Modal>
      )}

      {viewQR && (
        <Modal title={"Etiqueta · " + viewQR.nombre} icon="box" onClose={() => setViewQR(null)}
          footer={<><button className="btn" onClick={() => setViewQR(null)}>Cerrar</button><button className="btn accent" onClick={() => window.imprimirEtiqueta(viewQR)}><Icon name="download" size={14} /> Imprimir</button></>}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>QR</div>
              <window.UT.QRCodeSVG value={'PT|' + viewQR.id + '|' + viewQR.nombre} size={140} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Código de barras</div>
              <window.UT.BarcodeSVG value={viewQR.id} width={220} height={70} />
            </div>
          </div>
          <hr className="sep" />
          <div className="row gap-12" style={{ alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: viewQR.color, border: '1px solid var(--line)' }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{viewQR.nombre}</div>
              <div className="muted num" style={{ fontSize: 12 }}>{viewQR.id} · {viewQR.presentacion} · {viewQR.color.toUpperCase()}</div>
            </div>
            <div className="num" style={{ fontWeight: 600 }}>{formatCurrency(viewQR.precio)}</div>
          </div>
        </Modal>
      )}

      <Confirm open={!!deleting} danger title="Eliminar producto"
        msg="Esta acción no se puede deshacer. La receta vinculada también será eliminada."
        onYes={eliminar} onNo={() => setDeleting(null)} />

      {showCompare && (
        <ComparadorProductos
          ids={compareSet}
          data={data}
          onClose={() => setShowCompare(false)}
          onClear={() => { setCompareSet([]); setShowCompare(false); }}
        />
      )}
    </div>
  );
}

function ComparadorProductos({ ids, data, onClose, onClear }) {
  const { formatCurrency, Modal } = window.SH;
  const prods = ids.map((id) => data.productos.find((p) => p.id === id)).filter(Boolean);
  const costoDe = (p) => (data.recetas[p.id] || []).reduce((a, r) => { const mp = data.materias.find((m) => m.id === r.mp); return a + (mp ? mp.costo * r.cant : 0); }, 0);
  const vendidasDe = (p) => data.movimientos.filter((m) => m.item === p.id && m.tipo === 'Salida').reduce((a, m) => a + Math.abs(m.cant), 0);
  const filas = [
    { label: 'Presentación', get: (p) => p.presentacion },
    { label: 'Stock actual', get: (p) => p.stock, bar: (p) => p.stock },
    { label: 'Stock mínimo', get: (p) => p.minimo },
    { label: 'Precio venta', get: (p) => formatCurrency(p.precio), bar: (p) => p.precio },
    { label: 'Costo producción', get: (p) => formatCurrency(costoDe(p)), bar: (p) => costoDe(p) },
    { label: 'Margen', get: (p) => p.precio ? Math.round((1 - costoDe(p) / p.precio) * 100) + '%' : '—', bar: (p) => p.precio ? (1 - costoDe(p) / p.precio) * 100 : 0 },
    { label: 'Valor en stock', get: (p) => formatCurrency(p.stock * p.precio), bar: (p) => p.stock * p.precio },
    { label: 'Unidades vendidas', get: (p) => vendidasDe(p), bar: (p) => vendidasDe(p) },
    { label: 'Ingredientes (MP)', get: (p) => (data.recetas[p.id] || []).length },
  ];
  return (
    <Modal title="Comparativa de productos" icon="reportes" onClose={onClose}
      footer={<><button className="btn" onClick={onClear}>Limpiar selección</button><button className="btn accent" onClick={onClose}>Cerrar</button></>}>
      <div style={{ overflowX: 'auto' }}>
        <table className="t" style={{ fontSize: 12.5 }}>
          <thead>
            <tr>
              <th>Métrica</th>
              {prods.map((p) => (
                <th key={p.id} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 6, background: p.color, border: '1px solid var(--line)' }}></span>
                    <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const max = f.bar ? Math.max(...prods.map((p) => f.bar(p)), 1) : 0;
              return (
                <tr key={f.label}>
                  <td className="muted">{f.label}</td>
                  {prods.map((p) => (
                    <td key={p.id} style={{ textAlign: 'center' }}>
                      <div className="num" style={{ fontWeight: 500 }}>{f.get(p)}</div>
                      {f.bar && (
                        <div className="bar" style={{ marginTop: 4 }}><span style={{ width: (f.bar(p) / max * 100) + '%' }}></span></div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

window.ProductosTerminados = ProductosTerminados;

