import { supabase } from './supabase.js';

let currentSessionPromise = null;

/**
 * Valida la sesión del usuario actual y su rol antes de cargar la página.
 * @param {string} [requiredRole] - Rol requerido para acceder a la página ('administrador' | 'directivo').
 */
export async function checkSession(requiredRole = null) {
    if (currentSessionPromise) {
        const session = await currentSessionPromise;
        if (session && requiredRole) {
            const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (!allowedRoles.includes(session.rol)) {
                console.warn(`Acceso denegado: Se requiere rol '${requiredRole}' pero tienes '${session.rol}'`);
                window.location.href = 'index.html?access_denied=true';
                return null;
            }
        }
        return session;
    }

    currentSessionPromise = (async () => {
        if (!supabase) {
            console.error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
            // Hacer visible el body para poder ver el error
            document.body.style.visibility = 'visible';
            
            // Crear un banner de error visual en el DOM
            const errorBanner = document.createElement('div');
            errorBanner.style.position = 'fixed';
            errorBanner.style.top = '0';
            errorBanner.style.left = '0';
            errorBanner.style.width = '100%';
            errorBanner.style.backgroundColor = '#690005';
            errorBanner.style.color = '#ffdad6';
            errorBanner.style.padding = '16px';
            errorBanner.style.textAlign = 'center';
            errorBanner.style.zIndex = '9999';
            errorBanner.style.fontFamily = 'sans-serif';
            errorBanner.innerHTML = '<strong>Error de configuración:</strong> No se detectaron las credenciales de Supabase. Por favor, configure las variables de entorno <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel.';
            document.body.appendChild(errorBanner);
            
            return null;
        }

        try {
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

            // 4. Actualizar la interfaz con los datos del usuario logueado
            actualizarInterfazUsuario(user.email, rol);

            return { user, rol };
        } catch (e) {
            console.error('Error durante la validación de sesión:', e);
            
            // Asegurar que el body sea visible para ver el error
            document.body.style.visibility = 'visible';
            
            // Crear un banner de error visual en el DOM
            const errorBanner = document.createElement('div');
            errorBanner.style.position = 'fixed';
            errorBanner.style.top = '0';
            errorBanner.style.left = '0';
            errorBanner.style.width = '100%';
            errorBanner.style.backgroundColor = '#690005';
            errorBanner.style.color = '#ffdad6';
            errorBanner.style.padding = '16px';
            errorBanner.style.textAlign = 'center';
            errorBanner.style.zIndex = '9999';
            errorBanner.style.fontFamily = 'sans-serif';
            errorBanner.innerHTML = '<strong>Error de conexión/ejecución:</strong> Ocurrió un error inesperado al validar la sesión: <code>' + e.message + '</code>. Si estás en producción, verifica la configuración de variables de entorno (Supabase URL/Key) y conexión de red.';
            document.body.appendChild(errorBanner);
            
            return null;
        }
    })();

    const session = await currentSessionPromise;
    if (session && requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(session.rol)) {
            console.warn(`Acceso denegado: Se requiere rol '${requiredRole}' pero tienes '${session.rol}'`);
            window.location.href = 'index.html?access_denied=true';
            return null;
        }
    }
    return session;
}

/**
 * Cierra la sesión de Supabase Auth y limpia localStorage.
 */
export async function logout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
}

/**
 * Actualiza los elementos visuales de la interfaz relacionados con el perfil del usuario.
 */
function actualizarInterfazUsuario(email, rol) {
    const initUI = () => {
        // Mostrar la rama git activa al lado del título
        const headerTitle = document.querySelector('header h1');
        if (headerTitle && !document.getElementById('git-branch-badge')) {
            const branchBadge = document.createElement('span');
            branchBadge.id = 'git-branch-badge';
            branchBadge.className = 'bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider self-center';
            try {
                branchBadge.textContent = typeof __GIT_BRANCH__ !== 'undefined' ? __GIT_BRANCH__ : 'development';
            } catch (err) {
                branchBadge.textContent = 'development';
            }
            headerTitle.parentNode.appendChild(branchBadge);
        }

        // Actualizar el correo o nombre del operador en el sidebar si existe
        const operatorNameEl = document.querySelector('aside .font-title-lg');
        if (operatorNameEl) {
            operatorNameEl.textContent = email.split('@')[0].toUpperCase();
        }

        const operatorRoleEl = document.querySelector('aside .font-body-md');
        if (operatorRoleEl) {
            if (rol === 'administrador') {
                operatorRoleEl.textContent = 'ADMINISTRADOR';
            } else if (rol === 'control_interno') {
                operatorRoleEl.textContent = 'CONTROL INTERNO';
            } else {
                operatorRoleEl.textContent = 'DIRECTIVO';
            }
        }

        // Ocultar botones o vistas administrativas si el usuario es solo "directivo"
        if (rol === 'directivo') {
            // Ocultar botón "Reportar Gasto" del dashboard
            const btnReportar = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('REPORTAR GASTO'));
            if (btnReportar) {
                btnReportar.style.display = 'none';
            }

            // Ocultar acceso a "Gastos" y "Metas" en el menú si es necesario (o dejarlos como deshabilitados/ocultos)
            // Para dar flexibilidad, mantendremos los links pero redirigirán en checkSession() si intentan entrar.
        }

        // Mostrar accesos de administración de usuarios si el usuario es administrador
        if (rol === 'administrador') {
            const menuUsuarios = document.querySelectorAll('#menu-usuarios, #mobile-menu-usuarios');
            menuUsuarios.forEach(el => {
                el.classList.remove('hidden');
                if (el.style.display === 'none') {
                    el.style.display = '';
                }
            });
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
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
}
