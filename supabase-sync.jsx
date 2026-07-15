// Sincronizacion remota simple contra Supabase REST.
// Usa solo la publishable key del proyecto; no incluir service_role en frontend.
const PINTURASTOCK_SUPABASE_TABLE = 'pinturastock_state';
const PINTURASTOCK_SUPABASE_ROW = 'default';
const PINTURASTOCK_SESSION_KEY = 'pinturastock-supabase-session';

function getSupabaseConfig() {
  const cfg = window.PINTURASTOCK_CONFIG || {};
  return {
    url: (cfg.SUPABASE_URL || '').replace(/\/$/, ''),
    key: cfg.SUPABASE_PUBLISHABLE_KEY || cfg.SUPABASE_ANON_KEY || ''
  };
}

function isSupabaseConfigured() {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.key);
}

function getStoredSession() {
  try {
    const raw = sessionStorage.getItem(PINTURASTOCK_SESSION_KEY) || localStorage.getItem(PINTURASTOCK_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function storeSession(session, remember) {
  const raw = JSON.stringify(session);
  sessionStorage.setItem(PINTURASTOCK_SESSION_KEY, raw);
  if (remember) localStorage.setItem(PINTURASTOCK_SESSION_KEY, raw);
  else localStorage.removeItem(PINTURASTOCK_SESSION_KEY);
}

function clearStoredSession() {
  sessionStorage.removeItem(PINTURASTOCK_SESSION_KEY);
  localStorage.removeItem(PINTURASTOCK_SESSION_KEY);
}

function supabaseHeaders(extra = {}) {
  const { key } = getSupabaseConfig();
  const session = getStoredSession();
  const token = session?.access_token || key;
  return {
    apikey: key,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function fetchUserProfile(session) {
  if (!session?.access_token || !session?.user?.id || !isSupabaseConfigured()) return null;
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=*`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

function profileFromSession(session) {
  const user = session?.user || {};
  const meta = user.user_metadata || {};
  const dbProfile = session?.profile || {};
  const role = dbProfile.rol || dbProfile.role || meta.role || meta.rol || 'vendedor';
  const nombre = dbProfile.nombre || dbProfile.display_name || meta.nombre || meta.name || user.email || 'Usuario';
  return {
    id: user.id,
    user: user.email || user.id,
    email: user.email,
    nombre,
    rol: role,
    role,
    initials: nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'US',
    session
  };
}

async function signInWithPassword(email, password, remember = false) {
  if (!isSupabaseConfigured()) throw new Error('Supabase no esta configurado');
  const { url } = getSupabaseConfig();
  const { key } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Credenciales no validas');
  const session = await res.json();
  session.profile = await fetchUserProfile(session);
  storeSession(session, remember);
  return profileFromSession(session);
}

async function signOut() {
  if (isSupabaseConfigured()) {
    try {
      const { url } = getSupabaseConfig();
      await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: supabaseHeaders() });
    } catch (e) {}
  }
  clearStoredSession();
}

async function createManagedUser(payload) {
  if (!isSupabaseConfigured()) throw new Error('Supabase no esta configurado');
  const session = getStoredSession();
  if (!session?.access_token) throw new Error('Sesion no valida');
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/functions/v1/create-user`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `No se pudo crear usuario (${res.status})`);
  return body;
}

function getCurrentUser() {
  const session = getStoredSession();
  return session ? profileFromSession(session) : null;
}

async function loadRemoteState() {
  if (!isSupabaseConfigured()) return null;
  const { url } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${PINTURASTOCK_SUPABASE_TABLE}?id=eq.${encodeURIComponent(PINTURASTOCK_SUPABASE_ROW)}&select=data,updated_at`;
  const res = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!res.ok) throw new Error(`Supabase load failed: ${res.status}`);
  const rows = await res.json();
  return rows?.[0]?.data || null;
}

async function saveRemoteState(data) {
  if (!isSupabaseConfigured()) return false;
  const { url } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${PINTURASTOCK_SUPABASE_TABLE}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: supabaseHeaders({
      Prefer: 'resolution=merge-duplicates,return=minimal'
    }),
    body: JSON.stringify({
      id: PINTURASTOCK_SUPABASE_ROW,
      data,
      updated_at: new Date().toISOString()
    })
  });
  if (!res.ok) throw new Error(`Supabase save failed: ${res.status}`);
  return true;
}

window.PS_SUPABASE = {
  isConfigured: isSupabaseConfigured,
  signInWithPassword,
  signOut,
  getCurrentUser,
  createManagedUser,
  loadRemoteState,
  saveRemoteState
};
