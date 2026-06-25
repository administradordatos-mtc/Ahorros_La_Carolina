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
        // 1. Inyectar estilos CSS dinámicos para Drawer responsivo, overlays y dropdown
        if (!document.getElementById('auth-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-custom-styles';
            style.textContent = `
                .drawer-open {
                    transform: translateX(0) !important;
                }
                .overlay-visible {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                #profile-dropdown {
                    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.6), 0 10px 15px -5px rgba(0, 0, 0, 0.6);
                }
                @media print {
                    #header-logout-btn, #sidebar-logout-btn, #profile-dropdown, #sidebar-overlay {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 2. Comportamiento del Drawer móvil responsivo deslizable
        const sidebar = document.querySelector('aside');
        if (sidebar && !sidebar.classList.contains('drawer-config')) {
            sidebar.classList.add('drawer-config');
            
            // Reconfigurar clases para hacerlo fixed deslizable en móvil y flex relativo en desktop
            sidebar.className = sidebar.className
                .replace(/\bhidden\b/g, '')
                .replace(/\bsticky\b/g, '')
                .replace(/\btop-0\b/g, '') + 
                ' fixed inset-y-0 left-0 transform -translate-x-full transition-transform duration-300 md:relative md:translate-x-0 md:flex z-50';

            // Inyectar el overlay de fondo en el body
            let overlay = document.getElementById('sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sidebar-overlay';
                overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300 md:hidden';
                document.body.appendChild(overlay);
                
                // Cerrar sidebar al hacer clic en el overlay
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('drawer-open');
                    overlay.classList.remove('overlay-visible');
                });
            }

            // Buscar botón hamburguesa en cabecera
            const menuTrigger = document.querySelector('header .md\\:hidden') || 
                                document.querySelector('header button') ||
                                Array.from(document.querySelectorAll('header span')).find(el => el.textContent.includes('menu'));
                                
            if (menuTrigger) {
                menuTrigger.style.cursor = 'pointer';
                menuTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.add('drawer-open');
                    overlay.classList.add('overlay-visible');
                });
            }
        }

        // 3. Inyectar botón de salida directa en la cabecera (TopAppBar)
        const headerAvatarImg = document.querySelector('header img');
        let headerRightContainer = null;
        if (headerAvatarImg) {
            headerRightContainer = headerAvatarImg.closest('.flex');
            
            if (headerRightContainer && !document.getElementById('header-logout-btn')) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'header-logout-btn';
                logoutBtn.className = 'text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all cursor-pointer mr-xs flex items-center justify-center active:scale-90';
                logoutBtn.title = 'Cerrar Sesión Directa';
                logoutBtn.innerHTML = '<span class="material-symbols-outlined text-[22px]">logout</span>';
                
                const avatarContainer = headerAvatarImg.parentElement;
                headerRightContainer.insertBefore(logoutBtn, avatarContainer);

                logoutBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('¿Deseas cerrar la sesión de forma segura?')) {
                        await logout();
                    }
                });
            }
        }

        // 4. Inyectar menú Popover del perfil de usuario y avatar personalizado Base64
        if (headerAvatarImg && headerRightContainer && !document.getElementById('profile-dropdown')) {
            const dropdown = document.createElement('div');
            dropdown.id = 'profile-dropdown';
            dropdown.className = 'hidden absolute right-4 md:right-8 top-16 bg-[#171B1E] border border-primary/15 rounded-xl p-md shadow-2xl z-50 flex flex-col gap-sm min-w-[240px] text-left';
            
            const currentAvatarSrc = headerAvatarImg.src;

            dropdown.innerHTML = `
                <div class="flex items-center gap-sm">
                    <div class="w-12 h-12 rounded-full overflow-hidden border border-primary/20 bg-surface-variant relative group shrink-0">
                        <img id="dropdown-avatar-img" class="w-full h-full object-cover" src="${currentAvatarSrc}"/>
                        <label for="avatar-upload" class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <span class="material-symbols-outlined text-[18px]">photo_camera</span>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" class="hidden"/>
                    </div>
                    <div class="flex flex-col truncate">
                        <span id="dropdown-user-email" class="font-bold text-on-surface text-xs truncate" title="${email}">${email}</span>
                        <span id="dropdown-user-role" class="text-[10px] text-primary uppercase font-bold tracking-wider mt-[2px]">${(rol || 'directivo').replace('_', ' ')}</span>
                    </div>
                </div>
                <div class="h-[1px] bg-primary/10 my-base"></div>
                <button id="dropdown-change-photo-btn" class="flex items-center gap-xs text-on-surface-variant hover:text-white text-xs py-1 transition-colors cursor-pointer text-left w-full">
                    <span class="material-symbols-outlined text-[16px]">image</span> Cambiar imagen
                </button>
                <button id="dropdown-reset-photo-btn" class="flex items-center gap-xs text-red-400 hover:text-red-600 text-xs py-1 transition-colors cursor-pointer text-left w-full hidden">
                    <span class="material-symbols-outlined text-[16px]">refresh</span> Restaurar por defecto
                </button>
            `;

            headerRightContainer.appendChild(dropdown);

            const avatarContainer = headerAvatarImg.parentElement;
            avatarContainer.style.cursor = 'pointer';
            avatarContainer.title = 'Haz clic para ver perfil';
            
            // Eliminar listeners viejos clonando el elemento si es necesario,
            // pero como se recrea el DOM o es primera carga, adjuntamos evento normalmente:
            avatarContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });

            dropdown.addEventListener('click', (e) => e.stopPropagation());

            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });

            const avatarUpload = dropdown.querySelector('#avatar-upload');
            const dropdownChangePhotoBtn = dropdown.querySelector('#dropdown-change-photo-btn');
            const dropdownResetPhotoBtn = dropdown.querySelector('#dropdown-reset-photo-btn');

            const checkResetBtnVisibility = () => {
                if (localStorage.getItem('custom_avatar_base64')) {
                    dropdownResetPhotoBtn.classList.remove('hidden');
                } else {
                    dropdownResetPhotoBtn.classList.add('hidden');
                }
            };
            checkResetBtnVisibility();

            dropdownChangePhotoBtn.addEventListener('click', () => avatarUpload.click());

            avatarUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Data = e.target.result;
                    localStorage.setItem('custom_avatar_base64', base64Data);
                    actualizarAvataresDOM(base64Data);
                    checkResetBtnVisibility();
                };
                reader.readAsDataURL(file);
            });

            dropdownResetPhotoBtn.addEventListener('click', () => {
                localStorage.removeItem('custom_avatar_base64');
                const defaultSrc = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_udY14TfAr5VikDZlAEXD1yE8fZkOjht3DPO46HTwNthzPBiTE8sUlgUfr6xaeA0EHnXxseSA35WLDIec5YoC9no0-t1ASXEoL_XYGGKKPpQprE2IV37WGYlQd4EplxpD7byhhr4IbytFwYl0jsnhDA2egUkuFzQUl1zQfKOQbMaD-nYamxJhYf5RUc7K6b9zI0gI3HRURueYNu58NXMG9u2aGljo4QHo70wBFCDHSTl13mot0vU0p485qsCxVXkAoXPP6UGwgh8';
                actualizarAvataresDOM(defaultSrc);
                checkResetBtnVisibility();
            });
        }

        // 5. Cargar y persistir avatar guardado en localStorage
        const customAvatar = localStorage.getItem('custom_avatar_base64');
        if (customAvatar) {
            actualizarAvataresDOM(customAvatar);
        }

        // Helper para propagar avatar en toda la pantalla
        function actualizarAvataresDOM(src) {
            const allAvatars = document.querySelectorAll('header img, aside img, #profile-dropdown img');
            allAvatars.forEach(img => {
                img.src = src;
            });
        }

        // 6. Inyectar botón de cerrar sesión explícito en la base del Sidebar (Aside)
        if (sidebar) {
            const footerSidebar = sidebar.querySelector('.bg-secondary-container') || sidebar.lastElementChild;
            if (footerSidebar && !document.getElementById('sidebar-logout-btn')) {
                const sidebarLogout = document.createElement('button');
                sidebarLogout.id = 'sidebar-logout-btn';
                sidebarLogout.className = 'w-[calc(100%-24px)] mx-3 my-2 flex items-center gap-sm text-red-400 hover:bg-red-500/10 rounded-xl px-md py-sm transition-colors cursor-pointer border border-transparent hover:border-red-500/20 text-left';
                sidebarLogout.innerHTML = `
                    <span class="material-symbols-outlined text-[20px]">logout</span>
                    <span class="font-title-lg text-title-lg font-bold">Cerrar Sesión</span>
                `;
                
                footerSidebar.parentNode.insertBefore(sidebarLogout, footerSidebar);

                sidebarLogout.addEventListener('click', async () => {
                    if (confirm('¿Deseas cerrar la sesión de forma segura?')) {
                        await logout();
                    }
                });
            }
        }

        // Mostrar la rama git activa al lado del título
        const headerTitle = document.querySelector('header h1');
        if (headerTitle && !document.getElementById('git-branch-badge')) {
            const branchBadge = document.createElement('span');
            branchBadge.id = 'git-branch-badge';
            branchBadge.className = 'bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider self-center ml-xs';
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
        const userRole = rol || 'directivo';
        if (operatorRoleEl) {
            if (userRole === 'administrador') {
                operatorRoleEl.textContent = 'ADMINISTRADOR';
            } else if (userRole === 'control_interno') {
                operatorRoleEl.textContent = 'CONTROL INTERNO';
            } else {
                operatorRoleEl.textContent = 'DIRECTIVO';
            }
        }

        // Ocultar botones o vistas administrativas si el usuario es solo "directivo"
        if (userRole === 'directivo') {
            const btnReportar = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('REPORTAR GASTO'));
            if (btnReportar) {
                btnReportar.style.display = 'none';
            }
        }

        // Mostrar accesos de administración de usuarios si el usuario es administrador
        if (userRole === 'administrador') {
            const menuUsuarios = document.querySelectorAll('#menu-usuarios, #mobile-menu-usuarios');
            menuUsuarios.forEach(el => {
                el.classList.remove('hidden');
                if (el.style.display === 'none') {
                    el.style.display = '';
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
