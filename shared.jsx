// Shared utilities and small components
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// --- Data store (in-memory) ---
function loadSeed() {
  const node = document.getElementById('seed-data');
  return JSON.parse(node.textContent);
}

const formatCurrency = (n) => '$ ' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatNum = (n) => Number(n).toLocaleString('es-CO');

// Stock status helper
function stockStatus(stock, minimo) {
  if (stock <= 0) return { key: 'sin', label: 'Sin stock', tone: 'bad' };
  if (stock < minimo) return { key: 'bajo', label: 'Stock bajo', tone: 'warn' };
  if (stock < minimo * 1.5) return { key: 'medio', label: 'Por reponer', tone: 'info' };
  return { key: 'ok', label: 'En stock', tone: 'good' };
}

// --- Toasts ---
function useToasts() {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration || 3400;
    setItems((prev) => [...prev, { id, msg, duration, ...opts }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }, []);
  const dismiss = useCallback((id) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const Renderer = (
    <div className="toasts">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <Icon name={t.icon || 'check'} size={16} />
          <span>{t.msg}</span>
          {t.onUndo && (
            <button className="undo-btn" onClick={() => { t.onUndo(); dismiss(t.id); }}>Deshacer</button>
          )}
          <span className="toast-prog" style={{ animationDuration: t.duration + 'ms' }}></span>
        </div>
      ))}
    </div>
  );
  return { push, dismiss, Renderer };
}

// --- Modal ---
function Modal({ title, onClose, children, footer, icon = 'plus' }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog">
        <div className="modal-head">
          <Icon name={icon} size={18} />
          <h2>{title}</h2>
          <div style={{ flex: 1 }}></div>
          <button className="btn ghost sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// --- Empty state ---
function Empty({ title, sub, icon = 'box' }) {
  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ink-3)', textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-2)', display: 'grid', placeItems: 'center' }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {sub && <div style={{ fontSize: 13, maxWidth: 36 + 'ch' }}>{sub}</div>}
    </div>
  );
}

// --- Stock cell ---
function StockCell({ stock, minimo, unidad }) {
  const st = stockStatus(stock, minimo);
  const pct = Math.min(100, Math.round((stock / Math.max(minimo * 2, 1)) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="num">{formatNum(stock)} <span className="muted" style={{ fontSize: 11 }}>{unidad}</span></span>
        <span className="muted num" style={{ fontSize: 11 }}>mín {formatNum(minimo)}</span>
      </div>
      <div className={`bar ${st.tone}`}><span style={{ width: pct + '%' }}></span></div>
    </div>
  );
}

// --- Tag/Filter chip ---
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
        background: active ? 'var(--ink)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--ink-2)',
        fontSize: 12.5,
        fontWeight: 500,
        cursor: 'pointer'
      }}>
      {children}
    </button>
  );
}

// --- Confirm small ---
function Confirm({ open, title, msg, onYes, onNo, danger }) {
  if (!open) return null;
  return (
    <Modal title={title} icon={danger ? 'alert' : 'check'} onClose={onNo}
      footer={
        <>
          <button className="btn" onClick={onNo}>Cancelar</button>
          <button className={"btn " + (danger ? 'accent' : 'primary')} onClick={onYes}>Confirmar</button>
        </>
      }>
      <div style={{ color: 'var(--ink-2)' }}>{msg}</div>
    </Modal>
  );
}

// Tabs
function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button key={it.value} className={"tab " + (value === it.value ? 'active' : '')} onClick={() => onChange(it.value)}>
          {it.label}
          {it.count != null && <span className="muted num" style={{ marginLeft: 6, fontSize: 11 }}>({it.count})</span>}
        </button>
      ))}
    </div>
  );
}

// Filtros activos como chips removibles
function FilterChips({ chips }) {
  const active = chips.filter((c) => c.active);
  if (active.length === 0) return null;
  return (
    <div className="row gap-8" style={{ flexWrap: 'wrap', padding: '0 16px 12px' }}>
      <span className="muted" style={{ fontSize: 12 }}>Filtros:</span>
      {active.map((c) => (
        <span className="fchip" key={c.key}>
          {c.label}
          <button onClick={c.onClear} title="Quitar"><Icon name="x" size={11} /></button>
        </span>
      ))}
    </div>
  );
}

// Saludo dinámico según hora
function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

window.SH = { loadSeed, formatCurrency, formatNum, stockStatus, useToasts, Modal, Empty, StockCell, Chip, Confirm, Tabs, FilterChips, saludo };
