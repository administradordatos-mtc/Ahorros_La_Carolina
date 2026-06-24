-- Asegurar que la extensión pgcrypto esté activa (requerida para encriptar contraseñas)
create extension if not exists pgcrypto;

-- Función para que un administrador cambie la contraseña de cualquier usuario
create or replace function public.actualizar_password_usuario(target_user_id uuid, new_password text)
returns boolean
security definer
language plpgsql
as $$
declare
  caller_is_admin boolean;
begin
  -- 1. Validar que el usuario que ejecuta la función sea administrador
  caller_is_admin := public.es_administrador(auth.uid());
  
  if not caller_is_admin then
    raise exception 'No autorizado. Solo los administradores pueden realizar esta acción.';
  end if;

  -- 2. Validar longitud de la contraseña
  if length(new_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.';
  end if;

  -- 3. Actualizar la contraseña en auth.users usando bcrypt de pgcrypto
  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10))
  where id = target_user_id;

  return true;
end;
$$;
