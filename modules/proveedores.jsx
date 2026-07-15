// Módulo Proveedores — CRUD completo + estadísticas
const { useState: useStatePRV, useMemo: useMemoPRV } = React;

function Proveedores({ data, setData, toast }) {
  const { formatCurrency, formatNum, Modal, Empty, Tabs, Confirm } = window.SH;
  const [q, setQ] = useStatePRV('');
  const [openNew, setOpenNew] = useStatePRV(false);
  const [editing, setEditing] = useStatePRV(null);
  const [deleting, setDeleting] = useStatePRV(null);

  const blankForm = { id: '', nombre: '', telefono: '', correo: '', direccion: '', producto: '' };
  const [form, setForm] = useStatePRV(blankForm);

  const stats = useMemoPRV(() => {
    return (data.proveedores || []).map((p) => {
      const mps = data.materias.filter((m) => m.proveedor === p.nombre);
      const compras = (data.ordenesCompra || []).filter((o) => o.proveedor === p.id);
      const valorComprado = compras.reduce((a, o) => a + (o.total || 0), 0);
      return { ...p, _mps: mps.length, _compras: compras.length, _valor: valorComprado };
    });
  }, [data.proveedores, data.materias, data.ordenesCompra]);

  const filtered = stats.filter((p) =>
    !q || `${p.id} ${p.nombre} ${p.correo} ${p.producto}`.toLowerCase().includes(q.toLowerCase())
  );

  const openForEdit = (p) => {
    setEditing(p.id);
    setForm({ id: p.id, nombre: p.nombre, telefono: p.telefono || '', correo: p.correo || '', direccion: p.direccion || '', producto: p.producto || '' });
    setOpenNew(true);
  };

  const submit = () => {
    if (!form.nombre) { toast('Ingresa el nombre del proveedor', { icon: 'alert' }); return; }
    if (editing) {
      setData((d) => ({ ...d, proveedores: d.proveedores.map((x) => x.id === editing ? { ...x, ...form } : x) }));
      window.UT.logAuditoria(setData, 'Editó proveedor', `${form.nombre} (${form.id})`);
      toast('Proveedor actualizado');
    } else {
      const id = form.id || ('PRV-' + String((data.proveedores?.length || 0) + 1).padStart(3, '0'));
      setData((d) => ({ ...d, proveedores: [...(d.proveedores || []), { ...form, id }] }));
      window.UT.logAuditoria(setData, 'Creó proveedor', `${form.nombre} (${id})`);
      toast('Proveedor registrado');
    }
    setForm(blankForm);
    setEditing(null);
    setOpenNew(false);
  };

  const eliminar = () => {
    const p = data.proveedores.find((x) => x.id === deleting);
    setData((d) => ({ ...d, proveedores: d.proveedores.filter((x) => x.id !== deleting) }));
    if (p) window.UT.logAuditoria(setData, 'Eliminó proveedor', `${p.nombre} (${p.id})`);
    toast('Proveedor eliminado');
    setDeleting(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-sub">Empresas o personas que suministran materias primas. Mantén actualizada la información de contacto, productos que entregan e historial de compras.</p>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={() => { setEditing(null); setForm(blankForm); setOpenNew(true); }}><Icon name="plus" size={14} /></button>
          <button className="btn accent" onClick={() => { setEditing(null); setForm(blankForm); setOpenNew(true); }}><Icon name="plus" size={14} /> Nuevo proveedor</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi"><div className="label">Proveedores activos</div><div className="val">{stats.length}</div><div className="trend">Registrados en el sistema</div></div>
        <div className="kpi"><div className="label">MP suministradas</div><div className="val">{stats.reduce((a,p)=>a+p._mps,0)}</div><div className="trend">Vinculadas a proveedor</div></div>
        <div className="kpi"><div className="label">Órdenes de compra</div><div className="val">{stats.reduce((a,p)=>a+p._compras,0)}</div><div className="trend">Histórico total</div></div>
        <div className="kpi"><div className="label">Valor comprado</div><div className="val" style={{ fontSize: 22 }}>{formatCurrency(stats.reduce((a,p)=>a+p._valor,0))}</div><div className="trend">Acumulado</div></div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Listado de proveedores</h3>
          <div style={{ flex: 1 }}></div>
          <input className="input" placeholder="Buscar proveedor…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        </div>
        {filtered.length === 0 ? (
          <Empty title="Sin proveedores" sub="Registra el primero para vincular materias primas." icon="usuarios" />
        ) : (
          <table className="t">
            <thead><tr><th>ID</th><th>Nombre</th><th>Producto suministrado</th><th>Contacto</th><th>Dirección</th><th className="num" style={{textAlign:'right'}}>MP</th><th className="num" style={{textAlign:'right'}}>OC</th><th style={{ width: 1 }}></th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="num">{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td className="muted">{p.producto || '—'}</td>
                  <td>
                    {p.correo && <div className="muted" style={{ fontSize: 12 }}>{p.correo}</div>}
                    {p.telefono && <div className="num muted" style={{ fontSize: 12 }}>{p.telefono}</div>}
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{p.direccion || '—'}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{p._mps}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{p._compras}</td>
                  <td>
                    <div className="row gap-8">
                      <button className="btn sm ghost" onClick={() => openForEdit(p)} title="Editar"><Icon name="edit" size={12} /></button>
                      <button className="btn sm ghost danger" onClick={() => setDeleting(p.id)} title="Eliminar"><Icon name="trash" size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openNew && (
        <Modal title={editing ? 'Editar proveedor' : 'Nuevo proveedor'} icon="usuarios" onClose={() => { setOpenNew(false); setEditing(null); }}
          footer={<><button className="btn" onClick={() => { setOpenNew(false); setEditing(null); }}>Cancelar</button><button className="btn accent" onClick={submit}>{editing ? 'Actualizar' : 'Registrar'}</button></>}>
          <div className="grid-2">
            <div className="field"><label>Código</label><input className="input" disabled={!!editing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Automático" /></div>
            <div className="field"><label>Nombre o razón social</label><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Distribuidora Andina SAS" /></div>
            <div className="field"><label>Teléfono</label><input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="(601) 555-1234" /></div>
            <div className="field"><label>Correo electrónico</label><input className="input" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="ventas@andina.co" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Dirección</label><input className="input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Av. Suba #94-15, Bogotá" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Producto / categoría que suministra</label><input className="input" value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} placeholder="Pigmentos y resinas acrílicas" /></div>
          </div>
        </Modal>
      )}

      <Confirm open={!!deleting} danger
        title="Eliminar proveedor"
        msg="Esta acción no se puede deshacer. Las materias primas asociadas conservarán el nombre del proveedor."
        onYes={eliminar} onNo={() => setDeleting(null)} />
    </>
  );
}

window.Proveedores = Proveedores;
