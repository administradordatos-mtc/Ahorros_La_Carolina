import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase.js';

const DEFAULT_URL = 'https://bzwsmntpvpvjtwiufvlx.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6d3NtbnRwdnB2anR3aXVmdmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDk2NjYsImV4cCI6MjA5NjgyNTY2Nn0.e4QtIcJKnvEiiifdEqgJvLNLa6g7t13Gz4JxRFBbeUo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

// Elementos del DOM
const container = document.getElementById('users-table-body');
const modal = document.getElementById('user-modal');
const btnNew = document.getElementById('btn-nuevo-usuario');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-modal');
const form = document.getElementById('new-user-form');

document.addEventListener('DOMContentLoaded', async () => {
    if (!supabase) {
        console.warn('Users Admin: Supabase client is not initialized.');
        return;
    }

    // Cargar listado inicial
    await loadUsers();

    // Eventos del Modal
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    const hideModal = () => {
        modal.classList.add('hidden');
        form.reset();
    };

    if (btnClose) btnClose.addEventListener('click', hideModal);
    if (btnCancel) btnCancel.addEventListener('click', hideModal);

    // Formulario de Envío
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            const email = document.getElementById('new-email').value.trim();
            const password = document.getElementById('new-password').value;
            const role = document.getElementById('new-role').value;

            // Bloquear botón y dar feedback
            submitBtn.innerHTML = 'CREANDO...';
            submitBtn.disabled = true;

            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    throw new Error('Las credenciales de Supabase no están configuradas.');
                }

                // 1. Crear un cliente temporal aislado sin persistencia de sesión
                const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                });

                // 2. Registrar el usuario en Supabase Auth
                const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                    email,
                    password
                });

                if (authError) throw authError;

                const newUser = authData.user;
                if (!newUser) {
                    throw new Error('No se pudo obtener el usuario de Supabase Auth.');
                }

                // 3. Si el rol es administrador, actualizamos el rol del perfil
                // El trigger on_auth_user_created crea por defecto 'directivo'
                if (role === 'administrador') {
                    // Esperar 1 segundo para asegurar que el trigger de base de datos haya insertado la fila
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const { error: profileError } = await supabase
                        .from('perfiles')
                        .update({ rol: 'administrador' })
                        .eq('id', newUser.id);

                    if (profileError) throw profileError;
                }

                // Feedback visual de éxito
                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> CREADO';
                submitBtn.style.backgroundColor = '#10B981'; // Emerald 500

                // Recargar listado
                await loadUsers();

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                    hideModal();
                }, 1500);

            } catch (err) {
                console.error('Error al registrar usuario:', err);
                alert('Ocurrió un error al registrar el usuario: ' + err.message);
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = '';
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * Carga el listado de todos los usuarios registrados desde la tabla perfiles.
 */
async function loadUsers() {
    if (!container) return;

    try {
        const { data: users, error } = await supabase
            .from('perfiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';

        if (!users || users.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="3" class="py-lg text-center text-on-surface-variant">
                        No hay usuarios registrados en el sistema.
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(u => {
            const dateStr = new Date(u.created_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const row = document.createElement('tr');
            row.className = 'border-b border-primary/5 hover:bg-surface-variant/20 transition-colors';
            row.innerHTML = `
                <td class="py-md px-sm font-body-md text-on-surface">${u.email}</td>
                <td class="py-md px-sm">
                    <span class="px-xs py-[2px] rounded text-label-sm font-label-sm uppercase ${
                        u.rol === 'administrador' 
                            ? 'bg-primary/20 text-primary border border-primary/30' 
                            : 'bg-zinc-700/50 text-on-surface-variant border border-zinc-600/30'
                    }">
                        ${u.rol}
                    </span>
                </td>
                <td class="py-md px-sm font-body-md text-on-surface-variant">${dateStr}</td>
            `;
            container.appendChild(row);
        });

    } catch (err) {
        console.error('Error al cargar la tabla de usuarios:', err);
        container.innerHTML = `
            <tr>
                <td colspan="3" class="py-lg text-center text-red-500 font-bold">
                    Error al cargar los usuarios: ${err.message}
                </td>
            </tr>
        `;
    }
}
