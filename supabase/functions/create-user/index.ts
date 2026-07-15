import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo no permitido' }), { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Faltan variables de Supabase en la funcion' }), { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) {
    return new Response(JSON.stringify({ error: 'Sesion no valida' }), { status: 401, headers: corsHeaders });
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('rol,role,activo')
    .eq('id', authData.user.id)
    .maybeSingle();

  const callerRole = String(profile?.rol || profile?.role || '').toLowerCase();
  if (profileError || !profile?.activo || callerRole !== 'gerente') {
    return new Response(JSON.stringify({ error: 'Solo el gerente puede crear usuarios' }), { status: 403, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const nombre = String(body.nombre || '').trim();
  const rol = String(body.rol || '').trim().toLowerCase();
  const allowedRoles = ['gerente', 'vendedor', 'produccion', 'compras'];

  if (!email || !password || !nombre || !allowedRoles.includes(rol)) {
    return new Response(JSON.stringify({ error: 'Datos incompletos o rol no valido' }), { status: 400, headers: corsHeaders });
  }
  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'La clave debe tener minimo 8 caracteres' }), { status: 400, headers: corsHeaders });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol, role: rol }
  });
  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });
  }

  const userId = created.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No se obtuvo id del usuario' }), { status: 500, headers: corsHeaders });
  }

  const { error: upsertError } = await adminClient.from('profiles').upsert({
    id: userId,
    display_name: nombre,
    email,
    nombre,
    rol,
    role: rol,
    activo: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 400, headers: corsHeaders });
  }

  await adminClient.from('audit_log').insert({
    user_id: authData.user.id,
    user_email: authData.user.email,
    rol: callerRole,
    modulo: 'Usuarios',
    accion: 'Crear usuario',
    entidad: email,
    detalle: `Usuario ${email} creado con rol ${rol}`,
    despues: { id: userId, email, nombre, rol }
  });

  return new Response(JSON.stringify({ id: userId, email, nombre, rol }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
