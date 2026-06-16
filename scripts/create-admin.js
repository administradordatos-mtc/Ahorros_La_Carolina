import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Leer y parsear el archivo .env
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env en la raíz del proyecto.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env');
  process.exit(1);
}

// 2. Obtener credenciales desde los argumentos de la línea de comandos
const args = process.argv.slice(2);
let email = '';
let password = '';

args.forEach(arg => {
  if (arg.startsWith('--email=')) {
    email = arg.split('=')[1];
  }
  if (arg.startsWith('--password=')) {
    password = arg.split('=')[1];
  }
});

// Valores por defecto si no se especifican argumentos
if (!email) {
  email = 'admin@lacarolina.com';
}
if (!password) {
  password = 'AdminLaCarolina2026!';
}

console.log('----------------------------------------------------');
console.log('🚀 Iniciando creación/elevación de administrador...');
console.log(`📧 Correo: ${email}`);
console.log(`🔑 Contraseña: ${password}`);
console.log('----------------------------------------------------');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  let userId = null;

  try {
    // 1. Intentar registrar el usuario en Supabase Auth
    console.log('⏳ Intentando registrar el usuario en Supabase Auth...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      // Si el error es que el usuario ya existe, intentaremos iniciar sesión directamente
      if (signUpError.message.includes('already registered') || signUpError.status === 422) {
        console.log('ℹ️ El usuario ya está registrado en Supabase Auth. Intentando iniciar sesión para elevar rol...');
      } else {
        throw signUpError;
      }
    } else if (signUpData?.user) {
      userId = signUpData.user.id;
      console.log(`✅ Usuario registrado con éxito. ID: ${userId}`);
    }

    // 2. Iniciar sesión para obtener un token de sesión activo (necesario para la política RLS de perfiles)
    console.log('⏳ Iniciando sesión para autenticar la petición...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;

    const authenticatedUser = signInData.user;
    userId = authenticatedUser.id;
    console.log('✅ Sesión iniciada correctamente.');

    // Esperar un momento para asegurar que el trigger de base de datos haya creado el perfil
    console.log('⏳ Esperando la sincronización de base de datos...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Elevar el rol a 'administrador' en la tabla perfiles
    console.log('⏳ Actualizando el rol en la tabla "perfiles" a "administrador"...');
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .update({ rol: 'administrador' })
      .eq('id', userId)
      .select();

    if (perfilError) throw perfilError;

    console.log('🎉 ¡OPERACIÓN COMPLETADA CON ÉXITO! 🎉');
    console.log('----------------------------------------------------');
    console.log(`✅ El usuario ${email} ahora tiene el rol "administrador".`);
    console.log('Puedes iniciar sesión en la aplicación local o desplegada con estas credenciales.');
    console.log('----------------------------------------------------');

  } catch (err) {
    console.error('❌ Ocurrió un error durante el proceso:', err.message || err);
    process.exit(1);
  }
}

run();
