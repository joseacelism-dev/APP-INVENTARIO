// Pantalla de inicio de sesión
const { useState: useStateLG } = React;

function Login({ onLogin }) {
  const [user, setUser] = useStateLG('');
  const [pass, setPass] = useStateLG('');
  const [remember, setRemember] = useStateLG(false);
  const [loading, setLoading] = useStateLG(false);
  const [error, setError] = useStateLG('');

  const submit = (e) => {
    e?.preventDefault?.();
    setError('');
    if (!user || !pass) { setError('Ingresa usuario y contraseña'); return; }
    if (user !== 'gerente' || pass !== 'demo1234') {
      setError('Credenciales no válidas para esta versión local');
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ user, remember }); }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr',
      background: 'var(--bg)'
    }}>
      {/* Left visual */}
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.32 0.08 255) 0%, oklch(0.20 0.06 250) 100%)',
        position: 'relative', overflow: 'hidden',
        padding: '48px',
        display: 'flex', flexDirection: 'column', color: 'white'
      }}>
        {/* Paint splotches */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }} viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="lg1" cx="0.3" cy="0.3"><stop offset="0%" stopColor="oklch(0.65 0.16 250)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
            <radialGradient id="lg2" cx="0.7" cy="0.5"><stop offset="0%" stopColor="oklch(0.6 0.14 210)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
            <radialGradient id="lg3" cx="0.5" cy="0.8"><stop offset="0%" stopColor="oklch(0.55 0.16 280)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          </defs>
          <circle cx="180" cy="220" r="240" fill="url(#lg1)" style={{ animation: 'blob1 14s ease-in-out infinite' }} />
          <circle cx="440" cy="420" r="280" fill="url(#lg2)" style={{ animation: 'blob2 18s ease-in-out infinite' }} />
          <circle cx="280" cy="640" r="260" fill="url(#lg3)" style={{ animation: 'blob3 16s ease-in-out infinite' }} />
        </svg>
        <style>{`
          @keyframes blob1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,30px) scale(1.12); } 66% { transform: translate(-20px,50px) scale(0.95); } }
          @keyframes blob2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-30px) scale(1.15); } }
          @keyframes blob3 { 0%,100% { transform: translate(0,0) scale(1); } 40% { transform: translate(30px,-40px) scale(1.08); } 75% { transform: translate(-30px,20px) scale(0.92); } }
          @keyframes breathe { 0%,100% { transform: scale(1); box-shadow: inset 0 0 0 1px rgba(255,255,255,.25), 0 0 0 0 rgba(255,255,255,.15); } 50% { transform: scale(1.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35), 0 0 24px 4px rgba(255,200,150,.2); } }
        `}</style>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'radial-gradient(circle at 30% 30%, oklch(0.70 0.13 235), oklch(0.45 0.16 260) 70%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.25)',
            animation: 'breathe 4s ease-in-out infinite'
          }}></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>PinturaStock</div>
            <div style={{ fontSize: 11.5, opacity: 0.7, letterSpacing: '.04em', textTransform: 'uppercase' }}>Sistema de gestión</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 'auto', maxWidth: 420 }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Control total del inventario de pinturas, desde la materia prima hasta el producto final.
          </div>
          <div style={{ marginTop: 18, fontSize: 14, opacity: 0.75, lineHeight: 1.55 }}>
            Gestiona pigmentos, resinas, productos terminados y órdenes de producción desde un solo lugar. Información en tiempo real, decisiones más rápidas.
          </div>
          <div className="row" style={{ marginTop: 28, gap: 28, fontSize: 12.5, opacity: 0.8 }}>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>9</div>Tablas conectadas</div>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>1</div>Usuario administrador</div>
            <div><div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)' }}>6</div>Módulos operativos</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={submit} style={{ width: 'min(420px, 100%)' }}>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 600 }}>Iniciar sesión</h1>
          <div className="muted mt-12" style={{ fontSize: 14 }}>Accede al sistema con tus credenciales corporativas.</div>

          <div className="field mt-24">
            <label>Usuario</label>
            <input className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario.empresa" autoComplete="username" />
          </div>
          <div className="field mt-16">
            <label>Contraseña</label>
            <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          </div>

          <div className="row mt-16" style={{ justifyContent: 'space-between' }}>
            <label className="row gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Mantener sesión iniciada
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
          </div>

          {error && (
            <div className="mt-16" style={{ padding: 10, borderRadius: 6, background: 'var(--bad-bg)', color: 'var(--bad)', fontSize: 13 }}>
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn accent mt-16" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: 14, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando…' : <>Ingresar al sistema <Icon name="arrowR" size={14} /></>}
          </button>

          <div className="mt-24" style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-3)' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Cuenta de administrador</div>
            <div className="num" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px' }}>
              <span>gerente / demo1234</span><button type="button" className="btn ghost sm" onClick={() => { setUser('gerente'); setPass('demo1234'); }}>Usar</button>
            </div>
          </div>

          <div className="muted mt-16" style={{ fontSize: 11.5, textAlign: 'center' }}>
            PinturaStock v2.4 · Mendoza Pinturas SAS · © 2026
          </div>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
