// Módulo Categorías — gestiona clasificaciones de MP y PT
const { useState: useStateCAT } = React;

function Categorias({ data, setData, toast }) {
  const { Modal, Empty, Confirm } = window.SH;
  const [openNew, setOpenNew] = useStateCAT(false);
  const [editing, setEditing] = useStateCAT(null);
  const [deleting, setDeleting] = useStateCAT(null);
  const blank = { id: '', nombre: '', aplica: 'MP', color: '#B5572D', descripcion: '' };
  const [form, setForm] = useStateCAT(blank);

  const cats = data.categorias || [];
  const usoMP = (nombre) => data.materias.filter((m) => m.categoria === nombre).length;
  const usoPT = (nombre) => data.productos.filter((p) => p.tipo === nombre).length;

  const submit = () => {
    if (!form.nombre) { toast('Ingresa nombre', { icon: 'alert' }); return; }
    if (editing) {
      setData((d) => ({ ...d, categorias: d.categorias.map((x) => x.id === editing ? { ...x, ...form } : x) }));
      window.UT.logAuditoria(setData, 'Editó categoría', form.nombre);
      toast('Categoría actualizada');
    } else {
      const id = 'C-' + String(cats.length + 1).padStart(2, '0');
      setData((d) => ({ ...d, categorias: [...(d.categorias || []), { ...form, id }] }));
      window.UT.logAuditoria(setData, 'Creó categoría', form.nombre);
      toast('Categoría creada');
    }
    setForm(blank); setOpenNew(false); setEditing(null);
  };

  const openForEdit = (c) => {
    setEditing(c.id);
    setForm({ id: c.id, nombre: c.nombre, aplica: c.aplica || 'MP', color: c.color || '#B5572D', descripcion: c.descripcion || '' });
    setOpenNew(true);
  };

  const eliminar = () => {
    const c = cats.find((x) => x.id === deleting);
    if (c && (usoMP(c.nombre) > 0 || usoPT(c.nombre) > 0)) {
      toast('No se puede eliminar: hay items que la usan', { icon: 'alert' });
      setDeleting(null);
      return;
    }
    setData((d) => ({ ...d, categorias: d.categorias.filter((x) => x.id !== deleting) }));
    if (c) window.UT.logAuditoria(setData, 'Eliminó categoría', c.nombre);
    toast('Categoría eliminada');
    setDeleting(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-sub">Clasificación personalizable de materias primas y productos terminados. Cada categoría agrupa items relacionados y permite filtrar inventario.</p>
        </div>
        <div className="row gap-8">
          <button className="btn accent" onClick={() => { setEditing(null); setForm(blank); setOpenNew(true); }}><Icon name="plus" size={14} /> Nueva categoría</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi"><div className="label">Categorías totales</div><div className="val">{cats.length}</div><div className="trend">{cats.filter((c)=>c.aplica==='MP').length} MP · {cats.filter((c)=>c.aplica==='PT').length} PT</div></div>
        <div className="kpi"><div className="label">Items clasificados</div><div className="val">{data.materias.length + data.productos.length}</div><div className="trend">Total en inventario</div></div>
        <div className="kpi"><div className="label">Categorías en uso</div><div className="val">{cats.filter((c)=>usoMP(c.nombre)+usoPT(c.nombre)>0).length}</div><div className="trend">Asignadas a items</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Listado de categorías</h3><span className="meta">Aplicable a MP o PT</span></div>
        {cats.length === 0 ? (
          <Empty title="Sin categorías" sub="Crea categorías para agrupar tus materias primas." icon="materia" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: 16 }}>
            {cats.map((c) => {
              const uso = c.aplica === 'MP' ? usoMP(c.nombre) : usoPT(c.nombre);
              return (
                <div key={c.id} style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-card)' }}>
                  <div style={{ height: 8, background: c.color }}></div>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="row gap-8">
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: c.color }}></span>
                        <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                      </div>
                      <span className="pill">{c.aplica === 'MP' ? 'Materia prima' : 'Producto'}</span>
                    </div>
                    {c.descripcion && <div className="muted" style={{ fontSize: 12 }}>{c.descripcion}</div>}
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span className="muted num" style={{ fontSize: 12 }}>{c.id} · {uso} ítems</span>
                      <div className="row gap-8">
                        <button className="btn sm ghost" onClick={() => openForEdit(c)}><Icon name="edit" size={12} /></button>
                        <button className="btn sm ghost danger" onClick={() => setDeleting(c.id)} disabled={uso > 0} style={{ opacity: uso > 0 ? 0.3 : 1 }} title={uso > 0 ? 'No se puede eliminar: hay items que la usan' : 'Eliminar'}><Icon name="trash" size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openNew && (
        <Modal title={editing ? 'Editar categoría' : 'Nueva categoría'} icon="materia" onClose={() => { setOpenNew(false); setEditing(null); }}
          footer={<><button className="btn" onClick={() => { setOpenNew(false); setEditing(null); }}>Cancelar</button><button className="btn accent" onClick={submit}>{editing ? 'Actualizar' : 'Crear'}</button></>}>
          <div className="grid-2">
            <div className="field"><label>Nombre</label><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Catalizador" /></div>
            <div className="field"><label>Aplica a</label>
              <select className="select" value={form.aplica} onChange={(e) => setForm({ ...form, aplica: e.target.value })}>
                <option value="MP">Materia prima</option>
                <option value="PT">Producto terminado</option>
              </select>
            </div>
            <div className="field"><label>Color</label>
              <div className="row gap-8">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 40, height: 32, border: '1px solid var(--line)', borderRadius: 4 }} />
                <input className="input num" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Descripción (opcional)</label><input className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      <Confirm open={!!deleting} danger title="Eliminar categoría"
        msg="¿Confirmas la eliminación de esta categoría?"
        onYes={eliminar} onNo={() => setDeleting(null)} />
    </>
  );
}

window.Categorias = Categorias;
