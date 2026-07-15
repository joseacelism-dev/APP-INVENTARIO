// Módulo Auditoría — bitácora del sistema
const { useState: useStateAU, useMemo: useMemoAU } = React;

function Auditoria({ data }) {
  const { formatCurrency, Tabs, Empty } = window.SH;
  const [tab, setTab] = useStateAU('bitacora');
  const [q, setQ] = useStateAU('');

  const bitacora = data.bitacora || [];
  const precios = data.preciosHistorico || [];

  const filteredBit = bitacora.filter((b) =>
    !q || `${b.accion} ${b.detalle} ${b.user}`.toLowerCase().includes(q.toLowerCase())
  );
  const filteredPr = precios.filter((p) =>
    !q || `${p.item} ${p.tipo}`.toLowerCase().includes(q.toLowerCase())
  );

  const exportBit = () => {
    window.UT.exportXLS('bitacora-' + Date.now() + '.xls', bitacora);
  };
  const exportPr = () => {
    window.UT.exportXLS('historico-precios-' + Date.now() + '.xls', precios);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Auditoría y trazabilidad</h1>
          <p className="page-sub">Registro inmutable de todas las acciones del sistema. Cada operación queda documentada con fecha, usuario, acción y detalle.</p>
        </div>
        <div className="row gap-8">
          <button className="btn" onClick={tab === 'bitacora' ? exportBit : exportPr}><Icon name="download" size={14} /> Exportar Excel</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi"><div className="label">Eventos registrados</div><div className="val">{bitacora.length}</div><div className="trend">Bitácora total</div></div>
        <div className="kpi"><div className="label">Cambios de precio/costo</div><div className="val">{precios.length}</div><div className="trend">Histórico</div></div>
        <div className="kpi"><div className="label">Último evento</div><div className="val" style={{ fontSize: 18 }}>{bitacora[0]?.fecha || '—'}</div><div className="trend">{bitacora[0]?.accion || 'Sin actividad'}</div></div>
      </div>

      <Tabs items={[
        { value: 'bitacora', label: 'Bitácora de acciones', count: bitacora.length },
        { value: 'precios',  label: 'Histórico de precios', count: precios.length }
      ]} value={tab} onChange={setTab} />

      <div className="card">
        <div className="card-head">
          <h3>{tab === 'bitacora' ? 'Eventos del sistema' : 'Cambios de precio y costo'}</h3>
          <div style={{ flex: 1 }}></div>
          <input className="input" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        </div>
        {tab === 'bitacora' && (
          filteredBit.length === 0
            ? <Empty title="Sin eventos registrados" sub="Las acciones del sistema aparecerán aquí." icon="check" />
            : <table className="t">
                <thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th><th>Usuario</th></tr></thead>
                <tbody>
                  {filteredBit.map((b, i) => (
                    <tr key={i}>
                      <td className="muted num">{b.fecha}</td>
                      <td style={{ fontWeight: 500 }}>{b.accion}</td>
                      <td className="muted">{b.detalle}</td>
                      <td><span className="pill">{b.user}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}
        {tab === 'precios' && (
          filteredPr.length === 0
            ? <Empty title="Sin cambios registrados" sub="Cuando edites costos o precios, los cambios quedarán aquí." icon="check" />
            : <table className="t">
                <thead><tr><th>Fecha</th><th>Ítem</th><th>Tipo</th><th className="num" style={{textAlign:'right'}}>Valor anterior</th><th className="num" style={{textAlign:'right'}}>Valor nuevo</th><th className="num" style={{textAlign:'right'}}>Δ</th><th>Usuario</th></tr></thead>
                <tbody>
                  {filteredPr.map((p, i) => {
                    const delta = p.valorNuevo - p.valorAnterior;
                    const pct = p.valorAnterior ? (delta / p.valorAnterior * 100) : 0;
                    return (
                      <tr key={i}>
                        <td className="muted num">{p.fecha}</td>
                        <td className="num" style={{ fontWeight: 500 }}>{p.item}</td>
                        <td><span className="pill">{p.tipo}</span></td>
                        <td className="num muted" style={{ textAlign: 'right' }}>{formatCurrency(p.valorAnterior)}</td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(p.valorNuevo)}</td>
                        <td className="num" style={{ textAlign: 'right', color: delta > 0 ? 'var(--bad)' : 'var(--good)' }}>{delta > 0 ? '+' : ''}{pct.toFixed(1)}%</td>
                        <td><span className="pill">{p.user}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        )}
      </div>
    </>
  );
}

window.Auditoria = Auditoria;
