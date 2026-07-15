// Módulo Lógica del sistema — documentación de procesos, reglas y flujo
const { useState: useStateLG2 } = React;

function LogicaSistema() {
  const { Tabs } = window.SH;
  const [tab, setTab] = useStateLG2('procesos');

  const procesos = [
    { p: 'Registro de materias primas',      d: 'Ingresa insumos como resinas, pigmentos, solventes, aditivos, envases y etiquetas.', icon: 'materia' },
    { p: 'Entrada de inventario',            d: 'Al comprar materia prima, aumenta la cantidad disponible.',                          icon: 'arrowDn' },
    { p: 'Salida de inventario',             d: 'Al usar materia prima en producción, descuenta la cantidad utilizada.',              icon: 'arrowUp' },
    { p: 'Registro de productos terminados', d: 'Al finalizar una producción, aumenta el inventario de pinturas fabricadas.',         icon: 'producto' },
    { p: 'Cálculo de producción',            d: 'Calcula cuánta MP se necesita según la cantidad de pintura a fabricar.',             icon: 'calc' },
    { p: 'Validación de existencias',        d: 'Antes de registrar una producción, verifica que haya MP suficiente.',                icon: 'check' },
    { p: 'Generación de alertas',            d: 'Si una MP queda por debajo del mínimo, muestra una alerta.',                         icon: 'alert' },
    { p: 'Generación de reportes',           d: 'Organiza la información para consultar inventario, producción, entradas y salidas.', icon: 'reportes' }
  ];

  const reglas = [
    { r: 'No se puede registrar una producción si no hay materia prima suficiente.', d: 'El sistema valida las cantidades disponibles antes de descontar inventario.', tone: 'bad' },
    { r: 'Toda entrada o salida debe quedar registrada.',                            d: 'Cada movimiento guarda fecha, cantidad, responsable y motivo.',                tone: 'info' },
    { r: 'El inventario no puede quedar en valores negativos.',                      d: 'El sistema impide descuentos mayores a la cantidad disponible.',               tone: 'bad' },
    { r: 'Cada producto debe tener una fórmula de producción.',                      d: 'Para calcular materiales, el sistema debe conocer los insumos por unidad.',    tone: 'warn' },
    { r: 'Las alertas se generan según el stock mínimo.',                            d: 'Si la cantidad actual es ≤ al mínimo, el sistema muestra aviso.',              tone: 'warn' },
    { r: 'Solo usuarios autorizados pueden modificar información.',                  d: 'El sistema controla permisos según el rol del usuario.',                       tone: 'accent' }
  ];

  const validaciones = [
    { v: 'Campos obligatorios',            f: 'Evita guardar registros incompletos.' },
    { v: 'Cantidades numéricas',           f: 'Impide ingresar letras o valores incorrectos en cantidades.' },
    { v: 'Cantidades mayores a cero',      f: 'Evita registrar entradas, salidas o producciones con valores negativos o nulos.' },
    { v: 'Usuario y contraseña correctos', f: 'Protege el acceso al sistema.' },
    { v: 'Existencia suficiente',          f: 'Evita producir si no hay materia prima disponible.' },
    { v: 'Stock mínimo',                   f: 'Permite generar alertas de bajo inventario.' },
    { v: 'Producto existente',             f: 'Evita registrar producción de productos no creados previamente.' }
  ];

  const ejemplo = [
    { mp: 'Resina',          unitario: '0,30 L', total: '6 L'   },
    { mp: 'Pigmento blanco', unitario: '0,10 kg', total: '2 kg' },
    { mp: 'Solvente',        unitario: '0,20 L', total: '4 L'   },
    { mp: 'Aditivo',         unitario: '0,05 L', total: '1 L'   },
    { mp: 'Envase',          unitario: '1 u',    total: '20 u'  }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Lógica del sistema</h1>
          <p className="page-sub">Define cómo funciona internamente el software: procesos, cálculos, validaciones y reglas de negocio que garantizan que los datos ingresen, se procesen y se actualicen correctamente.</p>
        </div>
      </div>

      <Tabs items={[
        { value: 'procesos',    label: 'Procesos principales', count: procesos.length },
        { value: 'reglas',      label: 'Reglas de negocio',   count: reglas.length },
        { value: 'ejemplo',     label: 'Ejemplo de cálculo' },
        { value: 'flujo',       label: 'Flujo de funcionamiento' },
        { value: 'validaciones',label: 'Validaciones', count: validaciones.length }
      ]} value={tab} onChange={setTab} />

      {tab === 'procesos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {procesos.map((x, i) => (
            <div className="card" key={x.p} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={x.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>P{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{x.p}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{x.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reglas' && (
        <div className="card">
          <div className="card-head"><h3>Reglas del negocio</h3><span className="meta">Restricciones aplicadas por el sistema</span></div>
          <table className="t">
            <thead><tr><th style={{ width: 40 }}>#</th><th>Regla</th><th>Descripción</th></tr></thead>
            <tbody>
              {reglas.map((r, i) => (
                <tr key={r.r}>
                  <td><span className={"pill " + r.tone} style={{ minWidth: 28, justifyContent: 'center' }}>{String(i + 1).padStart(2, '0')}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.r}</td>
                  <td className="muted">{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ejemplo' && (
        <>
          <div className="card">
            <div className="card-head"><h3>Producir 20 galones de pintura blanca</h3><span className="meta">Aplicación de la fórmula registrada</span></div>
            <div className="card-body">
              <div className="grid-3" style={{ marginBottom: 18 }}>
                <div style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 8 }}>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Producto</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Pintura blanca</div>
                </div>
                <div style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 8 }}>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cantidad a fabricar</div>
                  <div className="num" style={{ fontWeight: 600, fontSize: 15 }}>20 galones</div>
                </div>
                <div style={{ padding: 14, background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Resultado del cálculo</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>5 materias primas a descontar</div>
                </div>
              </div>
              <table className="t">
                <thead><tr><th>Materia prima</th><th className="num" style={{ textAlign: 'right' }}>Cantidad por galón</th><th className="num" style={{ textAlign: 'right' }}>Cantidad para 20 galones</th></tr></thead>
                <tbody>
                  {ejemplo.map((e) => (
                    <tr key={e.mp}>
                      <td style={{ fontWeight: 500 }}>{e.mp}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{e.unitario}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{e.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-16" style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 6, fontSize: 13, color: 'var(--ink-2)' }}>
                Una vez calculadas las cantidades, el sistema verifica si el inventario tiene existencias suficientes. Si todo está disponible, registra la producción, descuenta las MP y aumenta el stock de productos terminados.
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'flujo' && <DiagramaFlujo />}

      {tab === 'validaciones' && (
        <div className="card">
          <div className="card-head"><h3>Validaciones del sistema</h3><span className="meta">Reglas aplicadas a cada operación</span></div>
          <table className="t">
            <thead><tr><th>Validación</th><th>Finalidad</th></tr></thead>
            <tbody>
              {validaciones.map((v) => (
                <tr key={v.v}>
                  <td style={{ fontWeight: 500 }}><Icon name="check" size={12} style={{ color: 'var(--good)', marginRight: 6 }} />{v.v}</td>
                  <td className="muted">{v.f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Diagrama visual de flujo
function DiagramaFlujo() {
  const node = (text, tone = 'normal') => ({ text, tone });
  return (
    <div className="card">
      <div className="card-head"><h3>Flujo de funcionamiento del sistema</h3><span className="meta">Diagrama del proceso desde el inicio de sesión hasta la finalización</span></div>
      <div className="card-body" style={{ background: 'var(--bg-2)', position: 'relative' }}>
        <svg viewBox="0 0 900 1100" style={{ width: '100%', height: 'auto', fontFamily: 'var(--font)' }}>
          <defs>
            <marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-3)" />
            </marker>
          </defs>

          {/* Helper render */}
          {/* Start */}
          <FlowNode x={350} y={20}  w={200} h={42} text="Inicio del sistema" type="start" />
          <FlowArrow x1={450} y1={62} x2={450} y2={88} />

          <FlowNode x={325} y={88} w={250} h={50} text="Inicio de sesión del usuario" />
          <FlowArrow x1={450} y1={138} x2={450} y2={164} />

          <FlowNode x={285} y={164} w={330} h={50} text="Validación de usuario y contraseña" type="decision" />
          <FlowArrow x1={450} y1={214} x2={450} y2={240} />

          <FlowNode x={325} y={240} w={250} h={50} text="Acceso al menú principal" />
          <FlowArrow x1={450} y1={290} x2={450} y2={316} />

          <FlowNode x={325} y={316} w={250} h={50} text="Selección del módulo" />

          {/* Split */}
          <path d="M 450 366 L 450 396 L 200 396 L 200 422" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#fa)" />
          <path d="M 450 366 L 450 396 L 700 396 L 700 422" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#fa)" />

          {/* Left: Materias primas */}
          <FlowNode x={90} y={422}  w={220} h={50} text="Materias primas" tone="accent" />
          <FlowArrow x1={200} y1={472} x2={200} y2={498} />
          <FlowNode x={90} y={498}  w={220} h={70} text={["Registrar entrada", "Consultar inventario", "Actualizar cantidades"]} />
          <FlowArrow x1={200} y1={568} x2={200} y2={594} />
          <FlowNode x={90} y={594}  w={220} h={42} text="Guardar movimiento" tone="good" />

          {/* Right: Producción */}
          <FlowNode x={590} y={422}  w={220} h={50} text="Producción" tone="accent" />
          <FlowArrow x1={700} y1={472} x2={700} y2={498} />
          <FlowNode x={590} y={498}  w={220} h={70} text={["Seleccionar producto", "Cantidad a producir", "Calcular materias primas"]} />
          <FlowArrow x1={700} y1={568} x2={700} y2={594} />
          <FlowNode x={555} y={594}  w={290} h={50} text="Validar existencias" type="decision" />
          <FlowArrow x1={700} y1={644} x2={700} y2={670} />

          <FlowNode x={555} y={670}  w={290} h={50} text="¿Hay materia prima suficiente?" type="decision" tone="warn" />

          {/* Split sí / no */}
          <path d="M 700 720 L 700 750 L 540 750 L 540 776" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#fa)" />
          <path d="M 700 720 L 700 750 L 860 750 L 860 776" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#fa)" />
          <text x="555" y="745" fontSize="12" fill="var(--good)" fontWeight="600">Sí</text>
          <text x="845" y="745" fontSize="12" fill="var(--bad)" fontWeight="600" textAnchor="end">No</text>

          {/* Sí path */}
          <FlowNode x={420} y={776} w={240} h={90} text={["Registrar producción", "Descontar materias primas", "Aumentar productos terminados"]} tone="good" />
          <FlowArrow x1={540} y1={866} x2={540} y2={892} />
          <FlowNode x={420} y={892} w={240} h={50} text="Generar reporte o comprobante" />
          <FlowArrow x1={540} y1={942} x2={540} y2={968} />

          {/* No path */}
          <FlowNode x={745} y={776} w={230} h={50} text="Mostrar alerta de faltantes" tone="bad" />

          {/* End */}
          <FlowNode x={400} y={968} w={280} h={50} text="Fin del proceso" type="end" />
        </svg>
      </div>
    </div>
  );
}

function FlowNode({ x, y, w, h, text, type, tone }) {
  const lines = Array.isArray(text) ? text : [text];
  let bg = '#fff', fg = 'var(--ink)', stroke = 'var(--line-2)', radius = 8;
  if (type === 'start' || type === 'end') { bg = 'var(--ink)'; fg = '#fff'; stroke = 'var(--ink)'; radius = h / 2; }
  if (type === 'decision') { radius = 6; stroke = 'var(--ink-3)'; }
  if (tone === 'accent')   { bg = 'var(--accent)'; fg = '#fff'; stroke = 'var(--accent)'; }
  if (tone === 'good')     { bg = 'oklch(0.95 0.05 150)'; fg = 'oklch(0.30 0.10 150)'; stroke = 'oklch(0.55 0.12 150)'; }
  if (tone === 'bad')      { bg = 'oklch(0.95 0.05 25)';  fg = 'oklch(0.40 0.16 25)'; stroke = 'oklch(0.55 0.18 25)'; }
  if (tone === 'warn')     { bg = 'oklch(0.96 0.06 80)';  fg = 'oklch(0.45 0.14 70)'; stroke = 'oklch(0.65 0.14 70)'; }

  const lineHeight = 16;
  const totalText = lines.length * lineHeight;
  const startY = y + (h - totalText) / 2 + lineHeight - 4;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={radius} fill={bg} stroke={stroke} strokeWidth="1.5" />
      {lines.map((l, i) => (
        <text key={i} x={x + w / 2} y={startY + i * lineHeight} fontSize="12.5" fill={fg} textAnchor="middle" fontWeight={lines.length === 1 ? 600 : 500}>{l}</text>
      ))}
    </g>
  );
}

function FlowArrow({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#fa)" />;
}

window.LogicaSistema = LogicaSistema;
