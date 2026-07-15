// Módulo Diseño de interfaz — documentación visual del prototipo
const { useState: useStateID } = React;

function DisenoInterfaz({ goTo }) {
  const { Tabs } = window.SH;
  const [tab, setTab] = useStateID('pantallas');

  const pantallas = [
    { id: 'login',      titulo: 'Inicio de sesión',           desc: 'Permite el acceso seguro al sistema.',                  elementos: ['Usuario', 'Contraseña', 'Botón ingresar', 'Recuperación de clave'], ruta: null },
    { id: 'dashboard',  titulo: 'Menú principal',             desc: 'Muestra las secciones principales del software.',       elementos: ['Sidebar lateral', 'KPIs generales', 'Atajos a módulos', 'Alertas'], ruta: 'dashboard' },
    { id: 'materias',   titulo: 'Materias primas',            desc: 'Permite registrar y consultar insumos.',                elementos: ['Formulario', 'Tabla de inventario', 'Búsqueda', 'Filtros por categoría'], ruta: 'materias' },
    { id: 'productos',  titulo: 'Productos terminados',       desc: 'Controla las pinturas fabricadas y disponibles.',       elementos: ['Tarjetas con color', 'Búsqueda', 'Filtro por presentación', 'Botón salida'], ruta: 'productos' },
    { id: 'produccion', titulo: 'Producción',                 desc: 'Registra producción y calcula MP necesarias.',          elementos: ['Selector de producto', 'Cantidad', 'Cálculo automático', 'Estado de disponibilidad'], ruta: 'produccion' },
    { id: 'movimientos',titulo: 'Movimientos de inventario',  desc: 'Registra entradas y salidas.',                          elementos: ['Tipo de movimiento', 'Selector de item', 'Motivo', 'Documento de referencia'], ruta: 'movimientos' },
    { id: 'reportes',   titulo: 'Reportes',                   desc: 'Visualiza información resumida.',                       elementos: ['Selector de rango', 'Gráficos de barras', 'Tablas resumen', 'Exportación'], ruta: 'reportes' },
    { id: 'usuarios',   titulo: 'Usuarios',                   desc: 'Administra acceso al sistema.',                         elementos: ['Tabla de miembros', 'Roles', 'Permisos', 'Estado activo/inactivo'], ruta: 'usuarios' }
  ];

  const paleta = [
    { uso: 'Fondo principal',  nombre: 'Azul niebla',        hex: '#F6F8FB', justificacion: 'Tono neutro frío que reduce la fatiga visual durante jornadas largas.' },
    { uso: 'Fondo secundario', nombre: 'Azul superficie',     hex: '#EAEFF6', justificacion: 'Diferencia paneles, cabeceras de tabla y zonas de agrupación.' },
    { uso: 'Tinta principal',  nombre: 'Azul tinta',          hex: '#131A24', justificacion: 'Alto contraste para texto y botones primarios sin ser puro negro.' },
    { uso: 'Acento (acciones)',nombre: 'Azul cobalto',        hex: '#2D6CB5', justificacion: 'Color técnico y confiable, identifica acciones clave del sistema.' },
    { uso: 'Éxito',            nombre: 'Azul turquesa',       hex: '#1F8FA8', justificacion: 'Confirma estados positivos: stock OK, operación completa.' },
    { uso: 'Advertencia',      nombre: 'Ámbar',              hex: '#C99320', justificacion: 'Alerta intermedia: stock por reponer, programación próxima.' },
    { uso: 'Error',            nombre: 'Rojo',               hex: '#C0392B', justificacion: 'Crítico: stock agotado, faltante de MP, errores de operación.' },
    { uso: 'Información',      nombre: 'Azul real',          hex: '#3A5BD9', justificacion: 'Mensajes informativos y badges neutros del sistema.' }
  ];

  const botones = [
    { btn: 'Guardar',         desc: 'Registra nueva información en la base de datos.',         estilo: 'Primario (acento)',  ej: 'btn accent' },
    { btn: 'Editar',          desc: 'Permite modificar datos existentes.',                     estilo: 'Secundario',         ej: 'btn' },
    { btn: 'Eliminar',        desc: 'Borra registros seleccionados.',                          estilo: 'Peligro',            ej: 'btn danger' },
    { btn: 'Buscar',          desc: 'Localiza información específica.',                        estilo: 'Campo de búsqueda',  ej: 'input + ⌘K' },
    { btn: 'Limpiar',         desc: 'Borra los campos del formulario.',                        estilo: 'Fantasma',           ej: 'btn ghost' },
    { btn: 'Actualizar',      desc: 'Refresca la información mostrada.',                       estilo: 'Secundario',         ej: 'btn' },
    { btn: 'Generar reporte', desc: 'Crea un informe del módulo seleccionado.',                estilo: 'Primario',           ej: 'btn primary' },
    { btn: 'Cerrar sesión',   desc: 'Finaliza el acceso del usuario al sistema.',              estilo: 'Fantasma',           ej: 'btn ghost' }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Diseño de la interfaz gráfica</h1>
          <p className="page-sub">Documentación de las pantallas, distribución visual, paleta de colores y convenciones de botones. Comparativa entre los bocetos iniciales (wireframes) y la implementación final del prototipo.</p>
        </div>
      </div>

      <Tabs items={[
        { value: 'pantallas',     label: 'Pantallas',         count: pantallas.length },
        { value: 'wireframes',    label: 'Bocetos vs. final' },
        { value: 'distribucion',  label: 'Distribución' },
        { value: 'colores',       label: 'Paleta de colores', count: paleta.length },
        { value: 'botones',       label: 'Botones de acción', count: botones.length }
      ]} value={tab} onChange={setTab} />

      {tab === 'pantallas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {pantallas.map((p) => (
            <div className="card" key={p.id}>
              <div className="card-head"><h3>{p.titulo}</h3>{p.ruta && <span className="pill good"><span className="dot"></span>Implementada</span>}</div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="muted" style={{ fontSize: 13 }}>{p.desc}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Elementos principales</div>
                  <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                    {p.elementos.map((e) => <span key={e} className="pill" style={{ fontSize: 11 }}>{e}</span>)}
                  </div>
                </div>
                {p.ruta && <button className="btn sm mt-12" onClick={() => goTo(p.ruta)}><Icon name="eye" size={12} /> Ver pantalla</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'wireframes' && (
        <div className="col gap-16">
          <WireframeCard
            titulo="Boceto · Menú principal"
            ruta="dashboard"
            goTo={goTo}
            wire={(
              <div className="wf">
                <div className="wf-row wf-head"><span>Sistema de Gestión para Producción de Pinturas</span><span className="wf-r">Usuario: Administrador · Cerrar sesión</span></div>
                <div className="wf-body">
                  <div className="wf-side">
                    <div className="wf-tit">MENÚ</div>
                    {['Inicio','Materias primas','Productos terminados','Producción','Movimientos','Reportes','Usuarios'].map((x) => <div key={x} className="wf-it">{x}</div>)}
                  </div>
                  <div className="wf-main">
                    <div className="wf-tit">PANEL PRINCIPAL</div>
                    <div className="wf-ln" style={{ marginTop: 14 }}>Bienvenido al sistema</div>
                    <div className="wf-ln muted">Seleccione un módulo para iniciar la gestión.</div>
                  </div>
                </div>
              </div>
            )}
          />
          <WireframeCard
            titulo="Boceto · Módulo de materias primas"
            ruta="materias"
            goTo={goTo}
            wire={(
              <div className="wf">
                <div className="wf-row wf-head"><span>Módulo de Materias Primas</span></div>
                <div className="wf-body" style={{ display: 'block', padding: 12 }}>
                  {['Nombre','Categoría','Unidad de medida','Cantidad actual','Stock mínimo','Proveedor'].map((l) => (
                    <div key={l} className="row" style={{ marginBottom: 6, gap: 6 }}>
                      <span className="wf-lab">{l}:</span>
                      <span className="wf-inp"></span>
                    </div>
                  ))}
                  <div className="row gap-8" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                    {['Guardar','Editar','Eliminar','Limpiar','Buscar'].map((b) => <span key={b} className="wf-btn">{b}</span>)}
                  </div>
                  <div className="wf-tit" style={{ marginTop: 14 }}>Tabla de materias primas registradas</div>
                  <div className="wf-table">
                    <div className="wf-tr wf-th"><span>ID</span><span>Nombre</span><span>Categoría</span><span>Unidad</span><span>Cantidad</span><span>Mínimo</span></div>
                    <div className="wf-tr"><span>1</span><span>Resina</span><span>Líquido</span><span>Litros</span><span>50</span><span>10</span></div>
                    <div className="wf-tr"><span>2</span><span>Pigmento rojo</span><span>Colorante</span><span>Kg</span><span>20</span><span>5</span></div>
                  </div>
                </div>
              </div>
            )}
          />
          <WireframeCard
            titulo="Boceto · Módulo de producción"
            ruta="produccion"
            goTo={goTo}
            wire={(
              <div className="wf">
                <div className="wf-row wf-head"><span>Módulo de Producción</span></div>
                <div className="wf-body" style={{ display: 'block', padding: 12 }}>
                  {['Producto a fabricar','Cantidad a producir','Fecha','Responsable'].map((l) => (
                    <div key={l} className="row" style={{ marginBottom: 6, gap: 6 }}>
                      <span className="wf-lab">{l}:</span>
                      <span className="wf-inp"></span>
                    </div>
                  ))}
                  <div className="row gap-8" style={{ marginTop: 10 }}>
                    <span className="wf-btn">Calcular materias primas</span>
                    <span className="wf-btn">Registrar producción</span>
                  </div>
                  <div className="wf-tit" style={{ marginTop: 14 }}>Materias primas requeridas</div>
                  <div className="wf-table">
                    <div className="wf-tr wf-th"><span>Materia prima</span><span>Necesaria</span><span>Disponible</span><span>Estado</span></div>
                    <div className="wf-tr"><span>Resina</span><span>10 litros</span><span>50 litros</span><span>OK</span></div>
                    <div className="wf-tr"><span>Pigmento</span><span>2 kg</span><span>20 kg</span><span>OK</span></div>
                  </div>
                </div>
              </div>
            )}
          />
          <style>{`
            .wf { background: #fdfcf9; border: 1px dashed var(--line-2); border-radius: 6px; font-family: var(--mono); font-size: 11.5px; color: var(--ink-2); overflow: hidden; height: 100%; }
            .wf-head { background: var(--bg-2); padding: 8px 12px; font-weight: 600; display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line-2); }
            .wf-r { color: var(--ink-3); font-weight: 400; }
            .wf-body { display: flex; min-height: 240px; }
            .wf-side { width: 160px; padding: 12px; border-right: 1px dashed var(--line-2); display: flex; flex-direction: column; gap: 4px; }
            .wf-tit { font-weight: 700; color: var(--ink-3); letter-spacing: .05em; font-size: 10px; }
            .wf-it { padding: 4px 0; color: var(--ink-2); }
            .wf-main { flex: 1; padding: 12px; }
            .wf-ln { padding: 4px 0; }
            .wf-lab { width: 130px; display: inline-block; color: var(--ink-2); }
            .wf-inp { flex: 1; height: 14px; border-bottom: 1px dashed var(--ink-4); display: inline-block; min-width: 200px; }
            .wf-btn { display: inline-block; padding: 3px 8px; border: 1px dashed var(--ink-3); border-radius: 3px; color: var(--ink-2); }
            .wf-table { margin-top: 6px; border: 1px dashed var(--line-2); border-radius: 3px; overflow: hidden; }
            .wf-tr { display: grid; grid-template-columns: repeat(6, 1fr); padding: 5px 8px; border-bottom: 1px dashed var(--line-2); gap: 4px; }
            .wf-tr:last-child { border-bottom: 0; }
            .wf-th { background: var(--bg-2); font-weight: 600; }
          `}</style>
        </div>
      )}

      {tab === 'distribucion' && (
        <div className="card">
          <div className="card-head"><h3>Distribución general de la pantalla</h3><span className="meta">Esquema de layout propuesto e implementado</span></div>
          <div className="card-body">
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
              <div style={{ background: 'var(--bg-2)', padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span><strong>Encabezado superior</strong> · Sistema, usuario activo, cerrar sesión</span>
                <span className="muted">56px de alto</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: 360 }}>
                <div style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <strong style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Menú lateral</strong>
                  <div className="muted" style={{ marginBottom: 10, fontSize: 11.5 }}>Accesos a módulos</div>
                  {['Dashboard','Materias primas','Productos terminados','Producción','Movimientos','Reportes','Usuarios','Base de datos'].map((m) => (
                    <div key={m} style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(0,0,0,.04)' }}>{m}</div>
                  ))}
                </div>
                <div style={{ padding: 18 }}>
                  <strong style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Área central</strong>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Formularios, tablas y reportes correspondientes al módulo activo</div>

                  <div className="grid-3 mt-16">
                    <div style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 6, fontSize: 12 }}>
                      <strong>Botones de acción</strong>
                      <div className="muted" style={{ marginTop: 4 }}>Guardar, editar, eliminar, buscar, limpiar, actualizar</div>
                    </div>
                    <div style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 6, fontSize: 12 }}>
                      <strong>Formularios</strong>
                      <div className="muted" style={{ marginTop: 4 }}>Captura de datos para alta y edición</div>
                    </div>
                    <div style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 6, fontSize: 12 }}>
                      <strong>Tablas de información</strong>
                      <div className="muted" style={{ marginTop: 4 }}>Datos ordenados con búsqueda y filtros</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16" style={{ padding: 12, background: 'var(--accent-bg)', borderRadius: 6, fontSize: 13, color: 'var(--ink-2)' }}>
              <strong>Nota de implementación:</strong> el encabezado superior incorpora migas de pan, búsqueda global (⌘K) y notificaciones. El menú lateral agrupa los módulos en cuatro secciones (General, Inventario, Operaciones, Administración) para reducir la carga cognitiva.
            </div>
          </div>
        </div>
      )}

      {tab === 'colores' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {paleta.map((c) => (
              <div className="card" key={c.hex}>
                <div style={{ height: 96, background: c.hex, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: 8, left: 12, color: 'rgba(255,255,255,.95)', textShadow: '0 1px 2px rgba(0,0,0,.4)', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.hex}</div>
                </div>
                <div className="card-body" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{c.uso}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.justificacion}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16" style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                        <strong>Decisión de diseño:</strong> la paleta usa una gama de azules fríos y neutros para transmitir confianza, orden y precisión técnica, reduciendo la fatiga visual en jornadas largas. El acento cobalto identifica acciones clave del sistema. Verde-turquesa, ámbar y rojo siguen la convención universal de semáforo para estados de stock.in imponer un cromatismo agresivo. Verde, ámbar y rojo siguen la convención universal de semáforo para estados de stock.
          </div>
        </>
      )}

      {tab === 'botones' && (
        <div className="card">
          <div className="card-head"><h3>Convenciones de botones</h3><span className="meta">Acciones consistentes en todo el sistema</span></div>
          <table className="t">
            <thead><tr><th>Botón</th><th>Función</th><th>Estilo visual</th><th>Ejemplo</th></tr></thead>
            <tbody>
              {botones.map((b) => (
                <tr key={b.btn}>
                  <td style={{ fontWeight: 500 }}>{b.btn}</td>
                  <td className="muted">{b.desc}</td>
                  <td><span className="pill">{b.estilo}</span></td>
                  <td>
                    {b.btn === 'Guardar' && <button className="btn accent sm"><Icon name="check" size={12} /> Guardar</button>}
                    {b.btn === 'Editar' && <button className="btn sm"><Icon name="edit" size={12} /> Editar</button>}
                    {b.btn === 'Eliminar' && <button className="btn sm danger"><Icon name="trash" size={12} /> Eliminar</button>}
                    {b.btn === 'Buscar' && <div className="search" style={{ width: 180, padding: '3px 8px' }}><Icon name="search" size={12} /><input placeholder="Buscar…" style={{ width: '100%' }} /></div>}
                    {b.btn === 'Limpiar' && <button className="btn ghost sm"><Icon name="x" size={12} /> Limpiar</button>}
                    {b.btn === 'Actualizar' && <button className="btn sm">↻ Actualizar</button>}
                    {b.btn === 'Generar reporte' && <button className="btn primary sm"><Icon name="download" size={12} /> Generar</button>}
                    {b.btn === 'Cerrar sesión' && <button className="btn ghost sm">Cerrar sesión</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function WireframeCard({ titulo, wire, ruta, goTo }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{titulo}</h3>
        <div style={{ flex: 1 }}></div>
        {ruta && <button className="btn sm accent" onClick={() => goTo(ruta)}><Icon name="arrowR" size={12} /> Ver implementación</button>}
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Boceto inicial (ASCII)</div>
          {wire}
        </div>
      </div>
    </div>
  );
}

window.DisenoInterfaz = DisenoInterfaz;
