// Movimientos de inventario — vista dedicada
const { useState: useStateMV, useMemo: useMemoMV } = React;

function Movimientos({ data, setData, toast }) {
  const { Modal, Chip, Tabs, formatNum } = window.SH;
  const [tab, setTab] = useStateMV('todos');
  const [q, setQ] = useStateMV('');
  const [openNew, setOpenNew] = useStateMV(false);
  const [form, setForm] = useStateMV({
    tipo: 'Entrada', tipoItem: 'MP', item: '', cantidad: 0, motivo: 'Compra', doc: '', opLink: ''
  });

  const filtered = useMemoMV(() => {
    return data.movimientos.filter((m) => {
      if (tab === 'entradas' && m.tipo !== 'Entrada') return false;
      if (tab === 'salidas' && m.tipo !== 'Salida') return false;
      if (tab === 'produccion' && m.tipo !== 'Producción') return false;
      if (q && !(`${m.item} ${m.doc} ${m.user}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [data.movimientos, tab, q]);

  const totalEntradas = data.movimientos.filter((m) => m.tipo === 'Entrada').reduce((a, m) => a + m.cant, 0);
  const totalSalidas  = data.movimientos.filter((m) => m.tipo === 'Salida').reduce((a, m) => a + Math.abs(m.cant), 0);
  const totalProd     = data.movimientos.filter((m) => m.tipo === 'Producción').reduce((a, m) => a + m.cant, 0);

  const itemsDisponibles = form.tipoItem === 'MP' ? data.materias : data.productos;

  // Si se está registrando Entrada de PT, ofrecer órdenes En proceso del producto seleccionado
  const requiereOP = form.tipo === 'Entrada' && form.tipoItem === 'PT';
  const ordenesAbiertas = requiereOP && form.item
    ? data.ordenes.filter((o) => o.producto === form.item && o.estado === 'En proceso')
    : [];

  // Al seleccionar una OP, autocompletar cantidad y documento
  const opSeleccionada = data.ordenes.find((o) => o.id === form.opLink);

  const submit = () => {
    const cant = +form.cantidad;
    if (!form.item || !cant) { toast('Completa item y cantidad', { icon: 'alert' }); return; }
    const sign = form.tipo === 'Salida' ? -1 : 1;
    setData((d) => {
      const mov = {
        fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
        tipo: requiereOP && form.opLink ? 'Producción' : form.tipo,
        item: form.item,
        cant: sign * cant,
        doc: form.opLink || form.doc || (form.tipo === 'Entrada' ? 'OC-' + Math.floor(1100 + Math.random()*200) : 'CONS-' + Math.floor(900 + Math.random()*100)),
        user: 'inventario'
      };
      let { materias, productos, ordenes } = d;
      if (form.tipoItem === 'MP') {
        materias = materias.map((m) => m.id === form.item ? { ...m, stock: Math.max(0, m.stock + sign * cant) } : m);
      } else {
        productos = productos.map((p) => p.id === form.item ? { ...p, stock: Math.max(0, p.stock + sign * cant) } : p);
      }
      // Si está vinculado a una OP, marcarla como Completada
      if (form.opLink) {
        ordenes = ordenes.map((o) => o.id === form.opLink ? { ...o, estado: 'Completada' } : o);
      }
      return { ...d, materias, productos, ordenes, movimientos: [mov, ...d.movimientos] };
    });
    setOpenNew(false);
    if (form.opLink) {
      toast(`Entrada registrada · orden ${form.opLink} completada`);
    } else {
      toast('Movimiento registrado');
    }
    setForm({ tipo: 'Entrada', tipoItem: 'MP', item: '', cantidad: 0, motivo: 'Compra', doc: '', opLink: '' });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Movimientos de inventario</h1>
          <p className="page-sub">Bitácora completa de entradas, salidas y producción. Cada movimiento queda asociado a un documento y al usuario que lo registró.</p>
        </div>
        <div className="row gap-8">
          <button className="btn"><Icon name="download" size={14} /> Exportar</button>
          <button className="btn accent" onClick={() => setOpenNew(true)}><Icon name="plus" size={14} /> Nuevo movimiento</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">Movimientos totales</div><div className="val">{data.movimientos.length}</div><div className="trend">Histórico completo</div></div>
        <div className="kpi"><div className="label">Entradas</div><div className="val" style={{ color: 'var(--good)' }}>+{formatNum(totalEntradas)}</div><div className="trend">Compras y ajustes</div></div>
        <div className="kpi"><div className="label">Salidas</div><div className="val" style={{ color: 'var(--bad)' }}>−{formatNum(totalSalidas)}</div><div className="trend">Ventas y consumos</div></div>
        <div className="kpi"><div className="label">Producción</div><div className="val" style={{ color: 'var(--accent)' }}>+{formatNum(totalProd)}</div><div className="trend">Fabricado</div></div>
      </div>

      <div className="card">
        <div className="card-head" style={{ gap: 12 }}>
          <Tabs items={[
            { value: 'todos', label: 'Todos', count: data.movimientos.length },
            { value: 'entradas', label: 'Entradas', count: data.movimientos.filter((m) => m.tipo === 'Entrada').length },
            { value: 'salidas', label: 'Salidas', count: data.movimientos.filter((m) => m.tipo === 'Salida').length },
            { value: 'produccion', label: 'Producción', count: data.movimientos.filter((m) => m.tipo === 'Producción').length },
          ]} value={tab} onChange={setTab} />
          <div style={{ flex: 1 }}></div>
          <input className="input" placeholder="Buscar item, documento, usuario…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        </div>

        <table className="t">
          <thead><tr><th>Fecha y hora</th><th>Tipo</th><th>Item</th><th>Descripción</th><th>Cantidad</th><th>Motivo</th><th>Documento</th><th>Usuario</th></tr></thead>
          <tbody>
            {filtered.map((m, i) => {
              const it = data.materias.find((x) => x.id === m.item) || data.productos.find((x) => x.id === m.item);
              const motivo = m.tipo === 'Entrada' ? 'Compra' : m.tipo === 'Salida' ? 'Venta' : 'Producción';
              return (
                <tr key={i}>
                  <td className="muted num">{m.fecha}</td>
                  <td><span className={"pill " + (m.tipo === 'Salida' ? 'bad' : m.tipo === 'Entrada' ? 'good' : 'accent')}><span className="dot"></span>{m.tipo}</span></td>
                  <td className="num" style={{ fontWeight: 500 }}>{m.item}</td>
                  <td>{it?.nombre || '—'}</td>
                  <td className="num" style={{ color: m.cant < 0 ? 'var(--bad)' : 'var(--good)', fontWeight: 600 }}>
                    {m.cant > 0 ? '+' : ''}{m.cant}
                  </td>
                  <td className="muted">{motivo}</td>
                  <td className="num muted">{m.doc}</td>
                  <td>{m.user}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openNew && (
        <Modal title="Registrar movimiento" icon="produccion" onClose={() => setOpenNew(false)}
          footer={<><button className="btn" onClick={() => setOpenNew(false)}>Cancelar</button><button className="btn accent" onClick={submit}>Registrar</button></>}>
          <div className="grid-2">
            <div className="field"><label>Tipo de movimiento</label>
              <select className="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value, opLink: '' })}>
                <option>Entrada</option><option>Salida</option>
              </select>
            </div>
            <div className="field"><label>Tipo de item</label>
              <select className="select" value={form.tipoItem} onChange={(e) => setForm({ ...form, tipoItem: e.target.value, item: '', opLink: '' })}>
                <option value="MP">Materia prima</option>
                <option value="PT">Producto terminado</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Item</label>
              <select className="select" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value, opLink: '' })}>
                <option value="">Selecciona…</option>
                {itemsDisponibles.map((x) => <option key={x.id} value={x.id}>{x.id} — {x.nombre}</option>)}
              </select>
            </div>

            {requiereOP && (
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>
                  Orden de producción <span className="muted" style={{ fontWeight: 400 }}>· vincula esta entrada con una OP en proceso para marcarla como completada</span>
                </label>
                <select
                  className="select"
                  value={form.opLink}
                  onChange={(e) => {
                    const op = data.ordenes.find((o) => o.id === e.target.value);
                    setForm({
                      ...form,
                      opLink: e.target.value,
                      cantidad: op ? op.cantidad : form.cantidad,
                      doc: e.target.value || form.doc,
                      motivo: e.target.value ? 'Producción' : form.motivo
                    });
                  }}
                  disabled={!form.item}>
                  <option value="">{form.item ? (ordenesAbiertas.length === 0 ? 'No hay órdenes en proceso para este producto' : 'Sin vincular (entrada manual)') : 'Selecciona primero un producto'}</option>
                  {ordenesAbiertas.map((o) => (
                    <option key={o.id} value={o.id}>{o.id} · {o.cantidad} u · {o.fecha} · {o.operario}</option>
                  ))}
                </select>
                {opSeleccionada && (
                  <div style={{ marginTop: 6, padding: 8, background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 5, fontSize: 12 }}>
                    <Icon name="check" size={12} /> Al registrar, la orden <strong>{opSeleccionada.id}</strong> pasará a estado <strong>Completada</strong>.
                  </div>
                )}
              </div>
            )}

            <div className="field"><label>Cantidad</label><input className="input num" type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} /></div>
            <div className="field"><label>Motivo</label>
              <select className="select" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} disabled={!!form.opLink}>
                {form.opLink ? <option>Producción</option> : (form.tipo === 'Entrada' ? <><option>Compra</option><option>Devolución</option><option>Ajuste</option></> : <><option>Venta</option><option>Distribución</option><option>Consumo</option><option>Ajuste</option></>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Documento de referencia</label><input className="input" value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} placeholder={form.opLink ? form.opLink : 'OC-1145 / VTA-7822 / AJU-001'} disabled={!!form.opLink} /></div>
          </div>
        </Modal>
      )}
    </>
  );
}

window.Movimientos = Movimientos;
