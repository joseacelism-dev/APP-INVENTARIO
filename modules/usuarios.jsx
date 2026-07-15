// Módulo Usuarios
const { useState: useStateUS, useMemo: useMemoUS } = React;

function Usuarios({ data, setData, toast }) {
  const { Modal, Empty } = window.SH;
  const [openNew, setOpenNew] = useStateUS(false);
  const [edit, setEdit] = useStateUS(null);
  const [form, setForm] = useStateUS({ nombre: '', email: '', rol: 'Gerente de Producción' });

  const roles = [
    { id: 'Gerente de Producción', desc: 'Único usuario administrador del sistema', color: 'var(--accent)',
      perms: [
        'Todos los módulos',
        'Materias primas',
        'Productos terminados',
        'Producción y órdenes',
        'Movimientos de inventario',
        'Reportes y exportación',
        'Configuración general',
        'Gestión de usuarios'
      ]
    }
  ];

  const counts = useMemoUS(() => {
    const c = {};
    data.usuarios.forEach((u) => c[u.rol] = (c[u.rol] || 0) + 1);
    return c;
  }, [data.usuarios]);

  const submitNew = () => {
    if (!form.nombre || !form.email) { toast('Completa nombre y email', { icon: 'alert' }); return; }
    setData((d) => ({
      ...d,
      usuarios: [...d.usuarios, { id: 'U-' + String(d.usuarios.length + 1).padStart(2,'0'), ...form, ult: 'nunca', activo: true }]
    }));
    setForm({ nombre: '', email: '', rol: 'Vendedor' });
    setOpenNew(false);
    toast('Usuario creado');
  };

  const toggle = (u) => {
    setData((d) => ({ ...d, usuarios: d.usuarios.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x) }));
    toast(u.activo ? 'Usuario desactivado' : 'Usuario activado');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Usuarios y permisos</h1>
          <p className="page-sub">Controla el acceso al sistema. Crea cuentas, asigna roles y restringe funciones según las responsabilidades de cada miembro del equipo.</p>
        </div>
        <div className="row gap-8">
          <button className="btn accent" onClick={() => setOpenNew(true)}><Icon name="plus" size={14} /> Nuevo usuario</button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Miembros del equipo</h3>
            <span className="meta">{data.usuarios.length} usuarios · {data.usuarios.filter((u) => u.activo).length} activos</span>
          </div>
          <table className="t">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Última actividad</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {data.usuarios.map((u) => {
                const initials = u.nombre.split(' ').map((s) => s[0]).join('').slice(0,2).toUpperCase();
                const rol = roles.find((r) => r.id === u.rol);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="row gap-12">
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ background: 'transparent', borderColor: rol?.color, color: rol?.color }}>
                        <span className="dot" style={{ background: rol?.color }}></span>{u.rol}
                      </span>
                    </td>
                    <td className="muted">{u.ult}</td>
                    <td>
                      <span className={"pill " + (u.activo ? 'good' : '')}>
                        <span className="dot"></span>{u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="row gap-8">
                        <button className="btn sm ghost" onClick={() => toggle(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head"><h3>Roles del sistema</h3><span className="meta">Permisos por defecto</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {roles.map((r) => (
              <div key={r.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="row gap-8">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }}></span>
                    <span style={{ fontWeight: 600 }}>{r.id}</span>
                  </div>
                  <span className="muted num" style={{ fontSize: 12 }}>{counts[r.id] || 0} miembros</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{r.desc}</div>
                <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                  {r.perms.map((p, i) => (
                    <span key={i} className="pill" style={{ fontSize: 11 }}><Icon name="check" size={10} /> {p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openNew && (
        <Modal title="Nuevo usuario" icon="usuarios" onClose={() => setOpenNew(false)}
          footer={<><button className="btn" onClick={() => setOpenNew(false)}>Cancelar</button><button className="btn accent" onClick={submitNew}>Crear usuario</button></>}>
          <div className="grid-2">
            <div className="field"><label>Nombre completo</label><input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Carla Mendoza" /></div>
            <div className="field"><label>Correo electrónico</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="carla@pinturastock.co" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Rol asignado</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {roles.map((r) => (
                  <button key={r.id} type="button" onClick={() => setForm({ ...form, rol: r.id })}
                    style={{
                      textAlign: 'left', padding: 12, borderRadius: 6,
                      border: '1px solid ' + (form.rol === r.id ? 'var(--accent)' : 'var(--line)'),
                      background: form.rol === r.id ? 'var(--accent-bg)' : 'var(--bg-card)',
                      cursor: 'pointer'
                    }}>
                    <div className="row gap-8" style={{ marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }}></span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.id}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

window.Usuarios = Usuarios;
