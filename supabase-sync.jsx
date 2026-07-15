// Sincronizacion remota simple contra Supabase REST.
// Usa solo la publishable key del proyecto; no incluir service_role en frontend.
const PINTURASTOCK_SUPABASE_TABLE = 'pinturastock_state';
const PINTURASTOCK_SUPABASE_ROW = 'default';

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

function supabaseHeaders(extra = {}) {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra
  };
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
  loadRemoteState,
  saveRemoteState
};
