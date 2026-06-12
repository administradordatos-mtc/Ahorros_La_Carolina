import { supabase } from './supabase.js';

/**
 * Valida la sesión del usuario actual y su rol antes de cargar la página.
 * @param {string} [requiredRole] - Rol requerido para acceder a la página ('administrador' | 'directivo').
 */
export async function checkSession(requiredRole = null) {
    // 1. Obtener la sesión actual de Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        // Si no hay sesión activa, borrar datos locales y redirigir al login
        localStorage.removeItem('user_role');
        window.location.href = 'login.html';
        return null;
    }

    const user = session.user;
    let rol = localStorage.getItem('user_role');

    // 2. Si no tenemos el rol en localStorage, lo consultamos en la base de datos
    if (!rol) {
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (perfilError || !perfil) {
            console.error('Error al recuperar rol del perfil:', perfilError);
            // Por defecto, asignar rol básico de directivo en caso de error
            rol = 'directivo';
        } else {
            rol = perfil.rol;
            localStorage.setItem('user_role', rol);
        }
    }

    // 3. Validar permisos si la página requiere un rol específico
    if (requiredRole && rol !== requiredRole) {
        console.warn(`Acceso denegado: Se requiere rol '${requiredRole}' pero tienes '${rol}'`);
        // Redirigir al dashboard general si no tiene permisos
        window.location.href = 'index.html?access_denied=true';
        return null;
    }

    // 4. Actualizar la interfaz con los datos del usuario logueado
    actualizarInterfazUsuario(user.email, rol);

    return { user, rol };
}

/**
 * Cierra la sesión de Supabase Auth y limpia localStorage.
 */
export async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
}

/**
 * Actualiza los elementos visuales de la interfaz relacionados con el perfil del usuario.
 */
function actualizarInterfazUsuario(email, rol) {
    document.addEventListener('DOMContentLoaded', () => {
        // Actualizar el correo o nombre del operador en el sidebar si existe
        const operatorNameEl = document.querySelector('aside .font-title-lg');
        if (operatorNameEl) {
            operatorNameEl.textContent = email.split('@')[0].toUpperCase();
        }

        const operatorRoleEl = document.querySelector('aside .font-body-md');
        if (operatorRoleEl) {
            operatorRoleEl.textContent = rol === 'administrador' ? 'ADMINISTRADOR' : 'DIRECTIVO';
        }

        // Ocultar botones o vistas administrativas si el usuario es solo "directivo"
        if (rol === 'directivo') {
            // Ocultar botón "Reportar Gasto" del dashboard
            const btnReportar = document.querySelector('button:contains("REPORTAR GASTO")') || 
                                Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('REPORTAR GASTO'));
            if (btnReportar) {
                btnReportar.style.display = 'none';
            }

            // Ocultar acceso a "Gastos" y "Metas" en el menú si es necesario (o dejarlos como deshabilitados/ocultos)
            // Para dar flexibilidad, mantendremos los links pero redirigirán en checkSession() si intentan entrar.
        }

        // Configurar el botón de cerrar sesión si existe en la interfaz
        // Buscaremos el elemento de perfil y le añadiremos evento de logout al hacer click en algún botón o avatar
        const userAvatar = document.querySelector('header img') || document.querySelector('header .w-10');
        if (userAvatar) {
            userAvatar.title = 'Haz clic para cerrar sesión';
            userAvatar.style.cursor = 'pointer';
            userAvatar.addEventListener('click', async () => {
                if (confirm('¿Deseas cerrar sesión?')) {
                    await logout();
                }
            });
        }
    });
}
