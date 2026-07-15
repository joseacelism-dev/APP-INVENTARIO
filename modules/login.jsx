// Pantalla de inicio de sesion con Supabase Auth y respaldo demo local.
const { useState: useStateLG } = React;

function Login({ onLogin }) {
  const [user, setUser] = useStateLG('');
  const [pass, setPass] = useStateLG('');
  const [remember, setRemember] = useStateLG(false);
  const [loading, setLoading] = useStateLG(false);
  const [error, setError] = useStateLG('');
  const authConfigured = window.PS_SUPABASE?.isConfigured?.();

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (!user || !pass) { setError('Ingresa usuario y contrasena'); return; }

    if (authConfigured) {
      setLoading(true);
      try {
        const profile = await window.PS_SUPABASE.signInWithPassword(user, pass, remember);
        onLogin({ user: profile, remember, provider: 'supabase' });
      } catch (err) {
        setError('Credenciales no validas o usuario sin acceso');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (user !== 'gerente' || pass !== 'demo1234') {
      setError('Credenciales no validas para esta version local');
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ user, remember, provider: 'demo' }); }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr', background: 'var(--bg)' }}>
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.32 0.08 255) 0%, oklch(0.20 0.06 250) 100%)',
        position: 'relative', overflow: 'hidden', padding: 48, display: 'flex', flexDirection: 'column', color: 'white'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'radial-gradient(circle at 30% 30%, oklch(0.70 0.13 235), oklch(0.45 0.16 260) 70%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.25)'
          }}></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>PinturaStock</div>
            <div style={{ fontSize: 11.5, opacity: 0.7, letterSpacing: '.04em', textTransform: 'uppercase' }}>Sistema de gestion segura</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 'auto', maxWidth: 430 }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Inventario, pedidos, produccion y compras con control de acceso por rol.
          </div>
          <div style={{ marginTop: 18, fontSize: 14, opacity: 0.75, lineHeight: 1.55 }}>
            La version conectada usa Supabase Auth, RLS, auditoria y trazabilidad por fecha del proceso.
          </div>
          <div className="row" style={{ marginTop: 28, gap: 28, fontSize: 12.5, opacity: 0.8 }}>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>5</div>Roles</div>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>RLS</div>Supabase</div>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>24/7</div>Auditoria</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={submit} style={{ width: 'min(420px, 100%)' }}>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 600 }}>Iniciar sesion</h1>
          <div className="muted mt-12" style={{ fontSize: 14 }}>
            {authConfigured ? 'Accede con tu usuario registrado en Supabase.' : 'Modo demo local. Configura Supabase para activar seguridad real.'}
          </div>

          <div className="field mt-24">
            <label>{authConfigured ? 'Correo corporativo' : 'Usuario'}</label>
            <input className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder={authConfigured ? 'usuario@empresa.com' : 'gerente'} autoComplete="username" />
          </div>
          <div className="field mt-16">
            <label>Contrasena</label>
            <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          </div>

          <div className="row mt-16" style={{ justifyContent: 'space-between' }}>
            <label className="row gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Mantener sesion iniciada
            </label>
          </div>

          {error && (
            <div className="mt-16" style={{ padding: 10, borderRadius: 6, background: 'var(--bad-bg)', color: 'var(--bad)', fontSize: 13 }}>
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn accent mt-16" disabled={loading} style={{ width: '100%', padding: 11, fontSize: 14, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando...' : <>Ingresar al sistema <Icon name="arrowR" size={14} /></>}
          </button>

          {!authConfigured && (
            <div className="mt-24" style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-3)' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Cuenta demo local</div>
              <div className="num" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px' }}>
                <span>gerente / demo1234</span>
                <button type="button" className="btn ghost sm" onClick={() => { setUser('gerente'); setPass('demo1234'); }}>Usar</button>
              </div>
            </div>
          )}

          <div className="muted mt-16" style={{ fontSize: 11.5, textAlign: 'center' }}>
            PinturaStock v2.5 secure
          </div>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
