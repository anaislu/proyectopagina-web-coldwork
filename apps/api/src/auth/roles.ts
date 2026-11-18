import { SetMetadata } from '@nestjs/common';

/** Debe coincidir con el enum public.app_role de supabase/migrations. */
export type AppRole =
  'admin' | 'supervisor' | 'tecnico' | 'operador_packing' | 'lectura';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
