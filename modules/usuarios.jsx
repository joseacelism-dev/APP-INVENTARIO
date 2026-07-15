// Modulo Usuarios - el gerente crea cuentas operativas.
const { useState: useStateUS, useMemo: useMemoUS } = React;

function Usuarios({ data, setData, toast, currentUser }) {
  const { Modal, Empty } = window.SH;
  const [openNew, setOpenNew] = useStateUS(false);
  const [saving, setSaving] = useStateUS(false);
  const [form, setForm] = useStateUS({ nombre: '', email: '', password: '', rol: 'vendedor' });
  const isGerente = String(currentUser?.role || currentUser?.rol || '').toLowerCase().includes('gerente');

  const roles = [
    { id: 'gerente', label: 'Gerente', desc: 'Usuario maestro con acceso total al sistema', color: 'var(--accent)', perms: ['Todos los modulos', 'Usuarios', 'Seguridad', 'Configuracion'] },
    { id: 'vendedor', label: 'Vendedor', desc: 'Crea pedidos y consulta productos terminados', color: 'var(--info)', perms: ['Pedidos', 'Productos', 'Movimientos'] },
    { id: 'produccion', label: 'Produccion', desc: 'Gestiona materias primas y ordenes de produccion', color: 'var(--good)', perms: ['Materias primas', 'Produccion', 'Movimientos'] },
    { id: 'compras', label: 'Compras', desc: 'Gestiona proveedores y ordenes de compra', color: 'var(--warn)', perms: ['Compras', 'Proveedores', 'Materias primas'] }
  ];

  const usuarios = data.usuarios || [];
  const counts = useMemoUS(() => {
    const c = {};
    usuarios.forEach((u) => c[u.rol] = (c[u.rol] || 0) + 1);
    return c;
  }, [usuarios]);

  const submitNew = async () => {
    if (!isGerente) { toast('Solo el gerente puede crear usuarios', { icon: 'alert' }); return; }
    if (!form.nombre || !form.email || !form.rol) { toast('Completa nombre, correo y rol', { icon: 'alert' }); return; }
    if (window.PS_SUPABASE?.isConfigured?.() && form.password.length < 8) {
      toast('La clave debe tener minimo 8 caracteres', { icon: 'alert' });
      return;
    }

    setSaving(true);
    try {
      let authId = null;
      if (window.PS_SUPABASE?.isConfigured?.()) {
        const created = await window.PS_SUPABASE.createManagedUser({
          email: form.email.trim(),
          password: form.password,
          nombre: form.nombre.trim(),
          rol: form.rol
        });
        authId = created.id || null;
      }

      setData((d) => {
        const existing = (d.usuarios || []).find((u) => u.email === form.email.trim());
        const user = {
          id: authId || existing?.id || 'U-' + String((d.usuarios || []).length + 1).padStart(2, '0'),
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol: form.rol,
          ult: 'nunca',
          activo: true,
          creadoPor: currentUser?.email || currentUser?.user || 'gerente',
          fechaCreacion: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
        };
        const usuarios = existing
          ? d.usuarios.map((u) => u.email === user.email ? { ...u, ...user } : u)
          : [...(d.usuarios || []), user];
        return { ...d, usuarios };
      });

      window.UT.logAuditoria(setData, 'Creo usuario', `${form.email.trim()} - ${form.rol}`, currentUser?.email || currentUser?.user || 'gerente', {
        modulo: 'Usuarios',
        entidad: form.email.trim(),
        usuarioRol: currentUser?.role || currentUser?.rol,
        despues: { email: form.email.trim(), rol: form.rol }
      });

      setForm({ nombre: '', email: '', password: '', rol: 'vendedor' });
      setOpenNew(false);
      toast(window.PS_SUPABASE?.isConfigured?.() ? 'Usuario creado en Supabase Auth' : 'Usuario creado en demo local');
    } catch (err) {
      toast(err.message || 'No se pudo crear usuario', { icon: 'alert' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (u) => {
    if (!isGerente) { toast('Solo el gerente puede cambiar usuarios', { icon: 'alert' }); return; }
    setData((d) => ({ ...d, usuarios: (d.usuarios || []).map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x) }));
    toast(u.activo ? 'Usuario desactivado localmente' : 'Usuario activado localmente');
  };

  const rolInfo = (rolId) => roles.find((r) => r.id === rolId) || roles[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Usuarios y permisos</h1>
          <p className="page-sub">El gerente administra usuarios operativos, asigna roles y entrega contrasenas iniciales. La creacion real usa Supabase Auth mediante funcion segura.</p>
        </div>
        <div className="row gap-8">
          <button className="btn accent" disabled={!isGerente} onClick={() => setOpenNew(true)}><Icon name="plus" size={14} /> Nuevo usuario</button>
        </div>
      </div>

      {!isGerente && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ color: 'var(--bad)' }}>
            <Icon name="alert" size={14} /> Solo el gerente puede crear o modificar usuarios.
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Miembros del equipo</h3>
            <span className="meta">{usuarios.length} usuarios - {usuarios.filter((u) => u.activo).length} activos</span>
          </div>
          {usuarios.length === 0 ? (
            <Empty title="Sin usuarios" sub="El gerente puede crear usuarios desde el boton Nuevo usuario." icon="usuarios" />
          ) : (
            <table className="t">
              <thead><tr><th>Usuario</th><th>Rol</th><th>Ultima actividad</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {usuarios.map((u) => {
                  const initials = (u.nombre || u.email || 'US').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
                  const rol = rolInfo(u.rol);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="row gap-12">
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>{initials}</div>
                          <div><div style={{ fontWeight: 500 }}>{u.nombre}</div><div className="muted" style={{ fontSize: 12 }}>{u.email}</div></div>
                        </div>
                      </td>
                      <td><span className="pill" style={{ background: 'transparent', borderColor: rol.color, color: rol.color }}><span className="dot" style={{ background: rol.color }}></span>{rol.label}</span></td>
                      <td className="muted">{u.ult || 'nunca'}</td>
                      <td><span className={"pill " + (u.activo ? 'good' : '')}><span className="dot"></span>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td><button className="btn sm ghost" disabled={!isGerente} onClick={() => toggle(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>Roles del sistema</h3><span className="meta">Gerente administra todo</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {roles.map((r) => (
              <div key={r.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="row gap-8"><span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }}></span><span style={{ fontWeight: 600 }}>{r.label}</span></div>
                  <span className="muted num" style={{ fontSize: 12 }}>{counts[r.id] || 0} miembros</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{r.desc}</div>
                <div className="row gap-8" style={{ flexWrap: 'wrap' }}>{r.perms.map((p) => <span key={p} className="pill" style={{ fontSize: 11 }}><Icon name="check" size={10} /> {p}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openNew && (
        <Modal title="Nuevo usuario" icon="usuarios" onClose={() => setOpenNew(false)}
          footer={<><button className="btn" onClick={() => setOpenNew(false)}>Cancelar</button><button className="btn accent" disabled={saving} onClick={submitNew}>{saving ? 'Creando...' : 'Crear usuario'}</button></>}>
          <div className="grid-2">
            <div className="field"><label>Nombre completo</label><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Carla Mendoza" /></div>
            <div className="field"><label>Correo electronico</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="carla@empresa.com" /></div>
            <div className="field"><label>Contrasena inicial</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimo 8 caracteres" /></div>
            <div className="field"><label>Rol asignado</label><select className="select" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
          </div>
          <div className="mt-16" style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>
            En produccion este boton llama la Edge Function <span className="num">create-user</span>. No se guarda la clave privada de Supabase en la app.
          </div>
        </Modal>
      )}
    </>
  );
}

window.Usuarios = Usuarios;
