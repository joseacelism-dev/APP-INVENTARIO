// Main app
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#2D6CB5",
  "density": "comoda",
  "navStyle": "compact",
  "showAvatars": true,
  "theme": "light"
}/*EDITMODE-END*/;

const REMOTE_STATUS = {
  local: { label: 'Local', tone: '' },
  syncing: { label: 'Sincronizando', tone: 'info' },
  online: { label: 'Supabase', tone: 'good' },
  offline: { label: 'Sin conexión', tone: 'warn' }
};

function mergeSeedState(seed, incoming) {
  if (!incoming || typeof incoming !== 'object') return seed;
  const hasCoreData = (incoming.materias || []).length > 0 || (incoming.productos || []).length > 0;
  if (!hasCoreData && seed.__demoSeedVersion) return seed;
  return { ...seed, ...incoming };
}

const ROLE_PAGES = {
  admin: '*',
  gerente: '*',
  produccion: ['dashboard', 'materias', 'productos', 'pedidos', 'produccion', 'movimientos', 'reportes'],
  vendedor: ['dashboard', 'productos', 'pedidos', 'movimientos'],
  compras: ['dashboard', 'materias', 'proveedores', 'pedidos', 'compras', 'movimientos', 'reportes']
};

function normalizeRole(user) {
  const raw = String(user?.role || user?.rol || '').toLowerCase();
  if (raw.includes('admin')) return 'admin';
  if (raw.includes('gerente')) return 'gerente';
  if (raw.includes('produccion')) return 'produccion';
  if (raw.includes('vendedor')) return 'vendedor';
  if (raw.includes('compra')) return 'compras';
  return raw || 'vendedor';
}

function canViewPage(user, page) {
  const role = normalizeRole(user);
  const allowed = ROLE_PAGES[role] || ROLE_PAGES.vendedor;
  return allowed === '*' || allowed.includes(page);
}

function App() {
  const STORAGE_KEY = 'pinturastock-data-v1';
  const [data, setData] = useStateApp(() => {
    const seed = window.SH.loadSeed();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return mergeSeedState(seed, parsed);
      }
    } catch (e) {}
    return seed;
  });

  const remoteReadyRef = React.useRef(false);
  const [remoteStatus, setRemoteStatus] = useStateApp('local');

  useEffectApp(() => {
    let alive = true;
    const sync = window.PS_SUPABASE;
    if (!sync?.isConfigured?.()) {
      remoteReadyRef.current = true;
      setRemoteStatus('local');
      return () => { alive = false; };
    }

    setRemoteStatus('syncing');
    sync.loadRemoteState()
      .then((remote) => {
        if (!alive) return;
        if (remote && typeof remote === 'object') {
          setData(mergeSeedState(window.SH.loadSeed(), remote));
        } else {
          sync.saveRemoteState(data).catch(() => {});
        }
        setRemoteStatus('online');
      })
      .catch(() => {
        if (alive) setRemoteStatus('offline');
      })
      .finally(() => {
        remoteReadyRef.current = true;
      });

    return () => { alive = false; };
  }, []);

  useEffectApp(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}

    const sync = window.PS_SUPABASE;
    if (!remoteReadyRef.current || !sync?.isConfigured?.()) return;

    const timer = setTimeout(() => {
      setRemoteStatus('syncing');
      sync.saveRemoteState(data)
        .then(() => setRemoteStatus('online'))
        .catch(() => setRemoteStatus('offline'));
    }, 900);

    return () => clearTimeout(timer);
  }, [data]);

  const resetData = () => {
    if (!['admin', 'gerente'].includes(normalizeRole(currentUser))) {
      toast('Solo admin o gerente puede reiniciar datos', { icon: 'alert' });
      return;
    }
    if (confirm('¿Borrar todos los datos y volver al estado inicial?')) {
      localStorage.removeItem(STORAGE_KEY);
      setData(window.SH.loadSeed());
    }
  };
  const [page, setPage] = useStateApp('dashboard');
  const [navParams, setNavParams] = useStateApp(null);
  const [loadingPage, setLoadingPage] = useStateApp(false);
  const [authed, setAuthed] = useStateApp(() => {
    const authConfigured = window.PS_SUPABASE?.isConfigured?.();
    return authConfigured
      ? Boolean(window.PS_SUPABASE?.getCurrentUser?.())
      : sessionStorage.getItem('pinturastock-auth') === '1' || localStorage.getItem('pinturastock-auth') === '1';
  });
  const [currentUser, setCurrentUser] = useStateApp(() => window.PS_SUPABASE?.getCurrentUser?.() || { user: 'gerente', nombre: 'Gerente de Producción', rol: 'Gerente de Producción', role: 'gerente', initials: 'GP' });

  // Hook tweaks panel — useTweaks returns [values, setTweak]
  const [tw, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const { useToasts } = window.SH;
  const { push: toast, Renderer: ToastRenderer } = useToasts();

  // Apply theme (dark mode)
  useEffectApp(() => {
    if (tw.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [tw.theme]);

  // Global keyboard: ⌘K / Ctrl+K opens search; presentation; cheatsheet; G-shortcuts
  const [searchOpen, setSearchOpen] = useStateApp(false);
  const [notifOpen, setNotifOpen] = useStateApp(false);
  const [present, setPresent] = useStateApp(false);
  const [cheatOpen, setCheatOpen] = useStateApp(false);
  const gKeyRef = window.React ? React.useRef(false) : { current: false };
  useEffectApp(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'select' || tag === 'textarea';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); return; }
      if (typing) return;
      // G then letter shortcuts
      if (gKeyRef.current) {
        const map = { d: 'dashboard', m: 'materias', p: 'produccion', r: 'reportes', t: 'productos', e: 'pedidos', u: 'usuarios', c: 'compras', v: 'movimientos' };
        if (map[e.key.toLowerCase()]) { goTo(map[e.key.toLowerCase()]); gKeyRef.current = false; return; }
        gKeyRef.current = false;
      }
      if (e.key.toLowerCase() === 'g') { gKeyRef.current = true; setTimeout(() => { gKeyRef.current = false; }, 1200); return; }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setCheatOpen((v) => !v); return; }
      if (e.key === 'Escape') { setPresent(false); setCheatOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Presentation mode toggles body class
  useEffectApp(() => {
    document.body.classList.toggle('present', present);
    return () => document.body.classList.remove('present');
  }, [present]);

  // Apply accent color
  useEffectApp(() => {
    document.documentElement.style.setProperty('--accent', tw.accentColor);
    // derive lighter variants by simple manipulation
    const tmp = document.createElement('div');
    tmp.style.color = tw.accentColor;
    document.body.appendChild(tmp);
    document.body.removeChild(tmp);
  }, [tw.accentColor]);

  useEffectApp(() => {
    if (tw.density === 'compacta') {
      document.documentElement.style.setProperty('font-size', '13px');
    } else {
      document.documentElement.style.setProperty('font-size', '14px');
    }
  }, [tw.density]);

  const goTo = (p, params = null) => {
    if (!canViewPage(currentUser, p)) {
      toast('Tu rol no tiene permiso para abrir ese modulo', { icon: 'alert' });
      return;
    }
    setPage(p);
    setNavParams(params);
    setLoadingPage(true);
    setTimeout(() => setLoadingPage(false), 240);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const userMap = {
    gerente: { user: 'gerente', nombre: 'Gerente de Producción', rol: 'Gerente de Producción', initials: 'GP' }
  };
  const handleLogin = ({ user, remember }) => {
    const profile = typeof user === 'object' ? user : (userMap[user] || userMap.gerente);
    setCurrentUser({ ...profile, role: normalizeRole(profile) });
    sessionStorage.setItem('pinturastock-auth', '1');
    if (remember) localStorage.setItem('pinturastock-auth', '1');
    else localStorage.removeItem('pinturastock-auth');
    setAuthed(true);
  };
  const handleLogout = () => {
    window.PS_SUPABASE?.signOut?.();
    sessionStorage.setItem('pinturastock-auth', '0');
    localStorage.removeItem('pinturastock-auth');
    setAuthed(false);
    setPage('dashboard');
  };

  if (!authed) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {ToastRenderer}
      </>
    );
  }

  const nav = [
    { id: 'dashboard',  label: 'Dashboard',         icon: 'dashboard' },
    { id: 'materias',   label: 'Materias primas',   icon: 'materia', badge: data.materias.length },
    { id: 'productos',  label: 'Productos terminados', icon: 'producto', badge: data.productos.length },
    { id: 'categorias', label: 'Categorías',        icon: 'box', badge: (data.categorias||[]).length },
    { id: 'proveedores',label: 'Proveedores',       icon: 'usuarios', badge: (data.proveedores||[]).length },
    { id: 'pedidos',    label: 'Pedidos vendedores', icon: 'box', badge: (data.pedidos||[]).filter((p) => p.estado !== 'Despacho inmediato').length || null },
    { id: 'produccion', label: 'Producción',        icon: 'produccion', badge: data.ordenes.filter((o) => o.estado === 'En proceso').length || null },
    { id: 'compras',    label: 'Órdenes de compra', icon: 'arrowDn', badge: (data.ordenesCompra||[]).filter((o)=>o.estado==='Emitida').length || null },
    { id: 'movimientos',label: 'Movimientos',       icon: 'arrowR' },
    { id: 'reportes',   label: 'Reportes',          icon: 'reportes' },
    { id: 'usuarios',   label: 'Usuarios',          icon: 'usuarios', badge: data.usuarios.length },
    { id: 'auditoria',  label: 'Auditoría',         icon: 'check', badge: (data.bitacora||[]).length || null },
    { id: 'basedatos',  label: 'Base de datos',     icon: 'settings' },
    { id: 'diseno',     label: 'Diseño UI',         icon: 'eye' },
    { id: 'logica',     label: 'Lógica del sistema',icon: 'calc' }
  ];

  const crumbs = {
    dashboard: ['Inicio', 'Dashboard'],
    materias: ['Inventario', 'Materias primas'],
    productos: ['Inventario', 'Productos terminados'],
    categorias: ['Inventario', 'Categorías'],
    proveedores: ['Inventario', 'Proveedores'],
    pedidos: ['Operaciones', 'Pedidos vendedores'],
    produccion: ['Operaciones', 'Producción'],
    compras: ['Operaciones', 'Órdenes de compra'],
    movimientos: ['Operaciones', 'Movimientos de inventario'],
    reportes: ['Información', 'Reportes'],
    usuarios: ['Administración', 'Usuarios'],
    auditoria: ['Administración', 'Auditoría'],
    basedatos: ['Administración', 'Base de datos'],
    diseno: ['Documentación', 'Diseño de interfaz'],
    logica: ['Documentación', 'Lógica del sistema']
  };
  const status = REMOTE_STATUS[remoteStatus] || REMOTE_STATUS.local;
  const visibleNav = (items) => items.filter((n) => canViewPage(currentUser, n.id));

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img src="assets/logo-logistica.svg" alt="" />
          </div>
          <div>
            <div className="brand-name">PinturaStock</div>
            <div className="brand-sub">v2.4 · Mendoza Pinturas SAS</div>
          </div>
        </div>

        <div className="nav-label">General</div>
        {visibleNav(nav.slice(0, 1)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}

        <div className="nav-label">Inventario</div>
        {visibleNav(nav.slice(1, 5)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}

        <div className="nav-label">Operaciones</div>
        {visibleNav(nav.slice(5, 9)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}

        <div className="nav-label">Información</div>
        {visibleNav(nav.slice(9, 10)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}

        <div className="nav-label">Administración</div>
        {visibleNav(nav.slice(10, 13)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}

        <div className="nav-label">Documentación</div>
        {visibleNav(nav.slice(13)).map((n) => (
          <button key={n.id} className={"nav-item " + (page === n.id ? 'active' : '')} onClick={() => goTo(n.id)}>
            <Icon className="ic" name={n.icon} size={16} />
            <span>{n.label}</span>
            {n.badge ? <span className="badge">{n.badge}</span> : <span></span>}
          </button>
        ))}
        

        <div className="sidebar-foot">
          {tw.showAvatars && <div className="avatar">{currentUser.initials}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.nombre}</div>
            <div className="muted" style={{ fontSize: 11 }}>{currentUser.rol}</div>
          </div>
          <button className="btn ghost sm" title="Cerrar sesión" onClick={handleLogout}><Icon name="x" size={14} /></button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            {crumbs[page].map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                <span className={i === crumbs[page].length - 1 ? 'cur' : ''}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="spacer"></div>
          <span className={"pill " + status.tone} title="Estado de sincronización">
            <span className="dot"></span>{status.label}
          </span>
          <div className="search" onClick={() => setSearchOpen(true)} style={{ cursor: 'pointer' }}>
            <Icon name="search" size={14} />
            <input placeholder="Buscar producto, lote, OP…" readOnly style={{ cursor: 'pointer', pointerEvents: 'none' }} />
            <span className="kbd">⌘K</span>
          </div>
          <button className="btn ghost sm" title={tw.theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} onClick={() => setTweak('theme', tw.theme === 'dark' ? 'light' : 'dark')}>
            {tw.theme === 'dark' ? <Icon name="sparkle" size={16} /> : <Icon name="eye" size={16} />}
          </button>
          <button className="btn ghost sm" title="Modo presentación" onClick={() => setPresent(true)}>
            <Icon name="dashboard" size={16} />
          </button>
          <button className="btn ghost sm" title="Notificaciones" style={{ position: 'relative' }} onClick={() => setNotifOpen((v) => !v)}>
            <Icon name="bell" size={16} />
            {(data.materias.filter((m)=>m.stock<m.minimo).length + data.productos.filter((p)=>p.stock<p.minimo).length + data.ordenes.filter((o)=>o.estado==='En proceso').length) > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--bad)' }}></span>
            )}
          </button>
          <button className="btn sm" onClick={handleLogout} title="Cerrar sesión">Cerrar sesión</button>
        </div>

        <div className="content">
          <div className="page-anim" key={page}>
          {loadingPage ? <window.PageSkeleton /> : <>
          {!canViewPage(currentUser, page) && <div className="card"><div className="card-body"><window.SH.Empty title="Sin permiso" sub="Tu rol no tiene acceso a este modulo." icon="alert" /></div></div>}
          {canViewPage(currentUser, page) && page === 'dashboard' && <Dashboard data={data} goTo={goTo} />}
          {canViewPage(currentUser, page) && page === 'materias' && <MateriasPrimas data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'productos' && <ProductosTerminados data={data} setData={setData} toast={toast} goTo={goTo} />}
          {canViewPage(currentUser, page) && page === 'categorias' && <Categorias data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'proveedores' && <Proveedores data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'pedidos' && <Pedidos data={data} setData={setData} toast={toast} goTo={goTo} currentUser={currentUser} />}
          {canViewPage(currentUser, page) && page === 'produccion' && <Produccion data={data} setData={setData} toast={toast} navParams={navParams} />}
          {canViewPage(currentUser, page) && page === 'compras' && <Compras data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'movimientos' && <Movimientos data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'reportes' && <Reportes data={data} />}
          {canViewPage(currentUser, page) && page === 'usuarios' && <Usuarios data={data} setData={setData} toast={toast} />}
          {canViewPage(currentUser, page) && page === 'auditoria' && <Auditoria data={data} />}
          {canViewPage(currentUser, page) && page === 'basedatos' && <BaseDatos />}
          {canViewPage(currentUser, page) && page === 'diseno' && <DisenoInterfaz goTo={goTo} />}
          {canViewPage(currentUser, page) && page === 'logica' && <LogicaSistema />}
          </>}
          </div>
        </div>
      </main>

      {ToastRenderer}

      {present && (
        <button className="btn present-exit" onClick={() => setPresent(false)}><Icon name="x" size={14} /> Salir de presentación (Esc)</button>
      )}

      {cheatOpen && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setCheatOpen(false); }}>
          <div className="modal" role="dialog" style={{ width: 'min(560px, 92vw)' }}>
            <div className="modal-head">
              <Icon name="sparkle" size={18} />
              <h2>Atajos de teclado</h2>
              <div style={{ flex: 1 }}></div>
              <button className="btn ghost sm" onClick={() => setCheatOpen(false)}><Icon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="sheet-grid">
                {[
                  ['⌘K / Ctrl+K', 'Búsqueda global'],
                  ['?', 'Mostrar / ocultar atajos'],
                  ['G luego D', 'Ir a Dashboard'],
                  ['G luego M', 'Ir a Materias primas'],
                  ['G luego T', 'Ir a Productos terminados'],
                  ['G luego P', 'Ir a Producción'],
                  ['G luego C', 'Ir a Órdenes de compra'],
                  ['G luego V', 'Ir a Movimientos'],
                  ['G luego R', 'Ir a Reportes'],
                  ['G luego U', 'Ir a Usuarios'],
                  ['Esc', 'Cerrar paneles / presentación'],
                ].map(([k, d]) => (
                  <div className="sheet-row" key={k}>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{d}</span>
                    <span className="kbd" style={{ whiteSpace: 'nowrap' }}>{k}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <window.SearchPalette open={searchOpen} data={data} goTo={goTo} onClose={() => setSearchOpen(false)} />
      <window.NotificationsPanel open={notifOpen} data={data} goTo={goTo} onClose={() => setNotifOpen(false)} />
      <window.HoverPreview data={data} />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Tema" />
        <window.TweakRadio
          label="Modo"
          value={tw.theme}
          onChange={(v) => setTweak('theme', v)}
          options={['light', 'dark']}
        />
        <window.TweakSection label="Color de acento" />
        <window.TweakColor
          label="Acento"
          value={tw.accentColor}
          onChange={(v) => setTweak('accentColor', v)}
          options={['#2D6CB5', '#1F8FA8', '#3A5BD9', '#5B6CC4', '#13344F']}
        />
        <window.TweakSection label="Densidad" />
        <window.TweakRadio
          label="Espaciado"
          value={tw.density}
          onChange={(v) => setTweak('density', v)}
          options={['comoda', 'compacta']}
        />
        <window.TweakSection label="Sidebar" />
        <window.TweakToggle label="Mostrar avatar" value={tw.showAvatars} onChange={(v) => setTweak('showAvatars', v)} />
        <window.TweakButton label="Reiniciar datos" onClick={resetData} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
