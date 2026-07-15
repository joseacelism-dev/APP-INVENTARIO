// Modulo Pedidos - conecta ventas con inventario, produccion y compras
const { useState: useStatePE, useMemo: useMemoPE } = React;

function Pedidos({ data, setData, toast, goTo }) {
  const { formatCurrency, formatNum, Empty, Chip } = window.SH;
  const blank = {
    cliente: '',
    vendedor: 'Vendedor',
    producto: data.productos[0]?.id || '',
    cantidad: 1,
    prioridad: 'Normal'
  };
  const [form, setForm] = useStatePE(blank);
  const [q, setQ] = useStatePE('');
  const [estado, setEstado] = useStatePE('Todos');

  const pedidos = data.pedidos || [];
  const productoSel = data.productos.find((p) => p.id === form.producto);
  const cantidad = Math.max(0, +form.cantidad || 0);

  const analizarPedido = (productoId, cant) => {
    const producto = data.productos.find((p) => p.id === productoId);
    if (!producto || !cant) {
      return { producto, despacho: 0, faltanteProduccion: 0, faltantesMP: [], requerimientos: [], estado: 'Sin datos', tone: '' };
    }

    const despacho = Math.min(producto.stock || 0, cant);
    const faltanteProduccion = Math.max(0, cant - despacho);
    const receta = data.recetas[producto.id] || [];
    const requerimientos = receta.map((r) => {
      const mp = data.materias.find((m) => m.id === r.mp);
      const total = (+r.cant || 0) * faltanteProduccion;
      const stock = mp?.stock || 0;
      const faltante = Math.max(0, total - stock);
      return {
        mp: r.mp,
        nombre: mp?.nombre || r.mp,
        unidad: mp?.unidad || '',
        proveedor: mp?.proveedor || 'Sin proveedor',
        costo: mp?.costo || 0,
        porUnidad: +r.cant || 0,
        total,
        stock,
        faltante,
        ok: faltante <= 0
      };
    });
    const faltantesMP = requerimientos.filter((r) => !r.ok);

    if (faltanteProduccion === 0) return { producto, despacho, faltanteProduccion, requerimientos, faltantesMP, estado: 'Despacho inmediato', tone: 'good' };
    if (receta.length === 0) return { producto, despacho, faltanteProduccion, requerimientos, faltantesMP, estado: 'Sin receta de produccion', tone: 'bad' };
    if (faltantesMP.length === 0) return { producto, despacho, faltanteProduccion, requerimientos, faltantesMP, estado: despacho > 0 ? 'Parcial + produccion' : 'A produccion', tone: 'info' };
    return { producto, despacho, faltanteProduccion, requerimientos, faltantesMP, estado: despacho > 0 ? 'Parcial + compra MP' : 'Requiere compra MP', tone: 'warn' };
  };

  const analisis = useMemoPE(() => analizarPedido(form.producto, cantidad), [form.producto, form.cantidad, data.productos, data.recetas, data.materias]);

  const resumen = useMemoPE(() => ({
    total: pedidos.length,
    despacho: pedidos.filter((p) => p.estado === 'Despacho inmediato').length,
    produccion: pedidos.filter((p) => p.estado.includes('produccion') || p.estado.includes('produccion')).length,
    compra: pedidos.filter((p) => p.estado.includes('compra MP') || p.estado.includes('OC')).length
  }), [pedidos]);

  const filtrados = useMemoPE(() => {
    return pedidos.filter((p) => {
      if (estado !== 'Todos' && p.estado !== estado) return false;
      const hay = `${p.id} ${p.cliente} ${p.vendedor} ${p.productoNombre} ${p.estado}`.toLowerCase();
      return !q || hay.includes(q.toLowerCase());
    });
  }, [pedidos, q, estado]);

  const crearPedido = () => {
    const cant = Math.max(0, +form.cantidad || 0);
    if (!form.cliente.trim()) { toast('Ingresa el cliente del pedido', { icon: 'alert' }); return; }
    if (!form.producto || !cant) { toast('Selecciona producto y cantidad', { icon: 'alert' }); return; }

    const a = analizarPedido(form.producto, cant);
    if (!a.producto) { toast('Producto no encontrado', { icon: 'alert' }); return; }

    const pedidoId = 'PED-' + new Date().getFullYear() + '-' + String((data.pedidos || []).length + 1).padStart(4, '0');
    const opId = a.faltanteProduccion > 0 && a.faltantesMP.length === 0 && a.requerimientos.length > 0
      ? 'OP-' + new Date().getFullYear() + '-' + String(40 + data.ordenes.length + 1).padStart(3, '0')
      : null;
    const loteId = opId ? 'LT-' + new Date().getFullYear() + '-' + String(((data.lotes || []).length) + 1).padStart(3, '0') : null;
    const fechaHora = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    const fecha = new Date().toLocaleDateString('es-CO');

    setData((d) => {
      let productos = d.productos.map((p) => p.id === a.producto.id ? { ...p, stock: Math.max(0, p.stock - a.despacho) } : p);
      let materias = d.materias;
      const movs = [];
      const ordenes = [...d.ordenes];
      const lotes = [...(d.lotes || [])];
      const ordenesCompra = [...(d.ordenesCompra || [])];
      const baseOcCount = ordenesCompra.length;
      const ocIds = [];
      const procesoFechas = {
        pedido: fechaHora,
        despacho: a.despacho > 0 ? fechaHora : null,
        produccion: opId ? fechaHora : null,
        compra: a.faltantesMP.length > 0 ? fechaHora : null
      };

      if (a.despacho > 0) {
        movs.push({ fecha: fechaHora, tipo: 'Salida', item: a.producto.id, cant: -a.despacho, doc: pedidoId, user: form.vendedor, proceso: 'Despacho pedido' });
      }

      if (opId) {
        materias = materias.map((m) => {
          const req = a.requerimientos.find((r) => r.mp === m.id);
          return req ? { ...m, stock: m.stock - req.total } : m;
        });
        a.requerimientos.forEach((r) => {
          movs.push({ fecha: fechaHora, tipo: 'Salida', item: r.mp, cant: -r.total, doc: opId, user: 'pedido', lote: loteId, proceso: 'Consumo OP por pedido' });
        });
        ordenes.unshift({
          id: opId,
          producto: a.producto.id,
          cantidad: a.faltanteProduccion,
          cantidadPlan: a.faltanteProduccion,
          mermaPct: 0,
          lote: loteId,
          estado: 'En proceso',
          fecha: new Date().toISOString().slice(0, 10),
          fechaHora,
          operario: 'Planificacion por pedido',
          pedido: pedidoId,
          procesoFechas
        });
        lotes.unshift({ id: loteId, op: opId, producto: a.producto.id, cantidad: a.faltanteProduccion, mermaPct: 0, fecha });
      }

      if (a.faltantesMP.length > 0) {
        const grupos = {};
        a.faltantesMP.forEach((r) => {
          const proveedorNombre = r.proveedor || 'Sin proveedor';
          if (!grupos[proveedorNombre]) grupos[proveedorNombre] = [];
          grupos[proveedorNombre].push(r);
        });
        Object.entries(grupos).forEach(([proveedorNombre, itemsGrupo], idx) => {
          const prov = (d.proveedores || []).find((p) => p.nombre === proveedorNombre || p.id === proveedorNombre);
          const id = 'OC-' + String(2026000 + baseOcCount + idx + 1);
          const detalle = itemsGrupo.map((r) => ({
            mp: r.mp,
            nombre: r.nombre,
            cant: +r.faltante.toFixed(2),
            costoUnit: r.costo,
            subtotal: +r.faltante.toFixed(2) * r.costo,
            unidad: r.unidad,
            pedido: pedidoId
          }));
          const total = detalle.reduce((acc, det) => acc + det.subtotal, 0);
          ocIds.push(id);
          ordenesCompra.unshift({
            id,
            fecha,
            fechaHora,
            proveedor: prov?.id || proveedorNombre,
            proveedorNombre,
            detalle,
            total,
            estado: 'Emitida',
            origen: 'Pedido vendedor',
            pedido: pedidoId,
            procesoFechas: { pedido: fechaHora, compra: fechaHora }
          });
        });
      }

      const estadoPedido = a.faltantesMP.length > 0
        ? (a.despacho > 0 ? 'Parcial + OC automatica' : 'OC automatica MP')
        : a.estado;
      const pedido = {
        id: pedidoId,
        fecha,
        fechaHora,
        cliente: form.cliente.trim(),
        vendedor: form.vendedor.trim() || 'Vendedor',
        producto: a.producto.id,
        productoNombre: a.producto.nombre,
        presentacion: a.producto.presentacion,
        cantidad: cant,
        prioridad: form.prioridad,
        despachoInmediato: a.despacho,
        faltanteProduccion: a.faltanteProduccion,
        estado: estadoPedido,
        op: opId,
        lote: loteId,
        ocs: ocIds,
        faltantesMP: a.faltantesMP,
        total: cant * (+a.producto.precio || 0),
        procesoFechas
      };

      return {
        ...d,
        productos,
        materias,
        ordenes,
        ordenesCompra,
        lotes,
        pedidos: [pedido, ...(d.pedidos || [])],
        movimientos: [...movs, ...d.movimientos]
      };
    });

    window.UT.logAuditoria(setData, 'Creo pedido', `${pedidoId} - ${a.producto.nombre} x ${cant}`);
    if (opId) toast(`Pedido ${pedidoId}: se genero ${opId} automaticamente`);
    else if (a.faltantesMP.length > 0) toast(`Pedido ${pedidoId}: se genero OC automatica de MP`, { icon: 'alert' });
    else toast(`Pedido ${pedidoId} listo para despacho`);
    setForm({ ...blank, producto: form.producto, vendedor: form.vendedor, cliente: '', cantidad: 1 });
  };

  const tonoEstado = (p) => {
    if (p.estado === 'Despacho inmediato') return 'good';
    if (p.estado.includes('compra') || p.estado.includes('OC')) return 'warn';
    if (p.estado.includes('Sin receta')) return 'bad';
    return 'info';
  };

  const estados = ['Todos', ...Array.from(new Set(pedidos.map((p) => p.estado)))];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pedidos de vendedores</h1>
          <p className="page-sub">Registra pedidos, valida disponibilidad de producto terminado y genera la orden de produccion cuando el stock no alcance.</p>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={() => goTo('productos')}><Icon name="producto" size={14} /> Inventario PT</button>
          <button className="btn" onClick={() => goTo('compras')}><Icon name="arrowDn" size={14} /> Compras MP</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">Pedidos</div><div className="val">{resumen.total}</div><div className="trend">Historico comercial</div></div>
        <div className="kpi"><div className="label">Despacho inmediato</div><div className="val" style={{ color: 'var(--good)' }}>{resumen.despacho}</div><div className="trend">Cubiertos con PT</div></div>
        <div className="kpi"><div className="label">A produccion</div><div className="val" style={{ color: 'var(--info)' }}>{resumen.produccion}</div><div className="trend">OP generadas</div></div>
        <div className="kpi"><div className="label">Requieren compra</div><div className="val" style={{ color: resumen.compra ? 'var(--warn)' : 'inherit' }}>{resumen.compra}</div><div className="trend">Falta materia prima</div></div>
      </div>

      <div className="grid-12-8">
        <div className="card">
          <div className="card-head">
            <Icon name="plus" size={16} style={{ color: 'var(--accent)' }} />
            <h3>Nuevo pedido</h3>
            <span className="meta">Analisis automatico de despacho, produccion y compras</span>
          </div>
          <div className="card-body">
            <div className="grid-2">
              <div className="field">
                <label>Cliente</label>
                <input className="input" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Nombre del cliente" />
              </div>
              <div className="field">
                <label>Vendedor</label>
                <input className="input" value={form.vendedor} onChange={(e) => setForm({ ...form, vendedor: e.target.value })} placeholder="Responsable comercial" />
              </div>
              <div className="field">
                <label>Producto terminado</label>
                <select className="select" value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })}>
                  {data.productos.map((p) => <option key={p.id} value={p.id}>{p.id} - {p.nombre} ({p.stock} disp.)</option>)}
                </select>
              </div>
              <div className="field">
                <label>Cantidad solicitada</label>
                <input className="input num" type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
              </div>
              <div className="field">
                <label>Prioridad</label>
                <select className="select" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  <option>Normal</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </select>
              </div>
            </div>

            <hr className="sep" />

            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Resultado del analisis</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{productoSel?.nombre || 'Selecciona un producto'}</div>
              </div>
              <span className={"pill " + analisis.tone}><span className="dot"></span>{analisis.estado}</span>
            </div>

            <div className="grid-3 mt-12">
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 6 }}>
                <div className="muted" style={{ fontSize: 11 }}>Stock actual PT</div>
                <div className="num" style={{ fontWeight: 600, fontSize: 20 }}>{formatNum(productoSel?.stock || 0)}</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 6 }}>
                <div className="muted" style={{ fontSize: 11 }}>Despacho ahora</div>
                <div className="num" style={{ fontWeight: 600, fontSize: 20, color: 'var(--good)' }}>{formatNum(analisis.despacho)}</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 6 }}>
                <div className="muted" style={{ fontSize: 11 }}>Falta producir</div>
                <div className="num" style={{ fontWeight: 600, fontSize: 20, color: analisis.faltanteProduccion ? 'var(--info)' : 'inherit' }}>{formatNum(analisis.faltanteProduccion)}</div>
              </div>
            </div>

            {analisis.faltanteProduccion > 0 && (
              <div className="mt-12">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Materias primas para cubrir el faltante</div>
                {analisis.requerimientos.length === 0 ? (
                  <div style={{ padding: 12, background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 13 }}>
                    Este producto no tiene receta. Define la formula antes de producir el faltante.
                  </div>
                ) : (
                  <table className="t">
                    <thead><tr><th>Materia prima</th><th>Necesario</th><th>Disponible</th><th>Estado</th></tr></thead>
                    <tbody>
                      {analisis.requerimientos.map((r) => (
                        <tr key={r.mp}>
                          <td><div style={{ fontWeight: 500 }}>{r.nombre}</div><div className="muted" style={{ fontSize: 11 }}>{r.mp} - {r.proveedor}</div></td>
                          <td className="num">{r.total.toFixed(2)} {r.unidad}</td>
                          <td className="num">{formatNum(r.stock)} {r.unidad}</td>
                          <td>{r.ok ? <span className="pill good"><span className="dot"></span>Disponible</span> : <span className="pill warn"><span className="dot"></span>Comprar {r.faltante.toFixed(2)} {r.unidad}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div className="row mt-16" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="num" style={{ fontWeight: 600 }}>{formatCurrency((productoSel?.precio || 0) * cantidad)}</div>
              <button className="btn accent" onClick={crearPedido}><Icon name="check" size={14} /> Registrar pedido</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Reglas del flujo</h3></div>
          <div className="card-body col gap-12" style={{ fontSize: 13 }}>
            <div><span className="pill good"><span className="dot"></span>Despacho</span><div className="muted mt-8">Si hay producto terminado suficiente, descuenta stock y registra salida del pedido.</div></div>
            <div><span className="pill info"><span className="dot"></span>Produccion</span><div className="muted mt-8">Si falta PT y hay materias primas, crea OP y descuenta MP de inmediato.</div></div>
            <div><span className="pill warn"><span className="dot"></span>Compra MP</span><div className="muted mt-8">Si falta materia prima, genera automaticamente la orden de compra por proveedor.</div></div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-head" style={{ gap: 12 }}>
          <h3>Pedidos registrados</h3>
          <div className="row gap-8">
            {estados.map((e) => <Chip key={e} active={estado === e} onClick={() => setEstado(e)}>{e}</Chip>)}
          </div>
          <div style={{ flex: 1 }}></div>
          <input className="input" placeholder="Buscar pedido..." value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        </div>
        {filtrados.length === 0 ? (
          <Empty title="Sin pedidos" sub="Los pedidos creados por vendedores apareceran aqui." icon="box" />
        ) : (
          <table className="t">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th className="num" style={{ textAlign: 'right' }}>Cant.</th><th>Flujo</th><th>Produccion / compras</th><th className="num" style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td><div className="num" style={{ fontWeight: 600 }}>{p.id}</div><div className="muted" style={{ fontSize: 11 }}>{p.fechaHora || p.fecha} - {p.vendedor}</div></td>
                  <td>{p.cliente}<div className="muted" style={{ fontSize: 11 }}>{p.prioridad}</div></td>
                  <td>{p.productoNombre}<div className="muted" style={{ fontSize: 11 }}>{p.producto} - {p.presentacion}</div></td>
                  <td className="num" style={{ textAlign: 'right' }}>{formatNum(p.cantidad)}</td>
                  <td><span className={"pill " + tonoEstado(p)}><span className="dot"></span>{p.estado}</span></td>
                  <td>
                    {p.op ? <div><span className="num" style={{ fontWeight: 600 }}>{p.op}</span><div className="muted" style={{ fontSize: 11 }}>Lote {p.lote}</div></div>
                      : p.ocs?.length ? <div><span className="num" style={{ fontWeight: 600 }}>{p.ocs.join(', ')}</span><div className="muted" style={{ fontSize: 11 }}>OC generada {p.procesoFechas?.compra || ''}</div></div>
                      : p.faltantesMP?.length ? <div className="muted" style={{ fontSize: 12 }}>{p.faltantesMP.length} MP por comprar</div>
                      : <span className="muted">No requiere</span>}
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.total || 0)}</td>
                  <td>
                    <div className="row gap-8">
                      {p.op && <button className="btn sm" onClick={() => goTo('produccion', { producto: p.producto })}><Icon name="produccion" size={12} /> OP</button>}
                      {p.faltantesMP?.length > 0 && <button className="btn sm accent" onClick={() => goTo('compras')}><Icon name="arrowDn" size={12} /> OC</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
