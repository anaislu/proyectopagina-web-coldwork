import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.guard';
import { Roles } from '../auth/roles';
import { SupabaseService } from '../supabase/supabase.service';

/** Ejemplo de recurso protegido: equipos de refrigeración. */
@Controller('equipos')
export class EquiposController {
  constructor(private readonly supabase: SupabaseService) {}

  @Roles('admin', 'supervisor', 'tecnico', 'lectura')
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    // RLS filtra filas según auth.uid()/app_role: no hay WHERE de seguridad aquí.
    const { data, error } = await this.supabase
      .forUser(user.jwt)
      .from('equipos')
      .select('id, codigo, tipo, planta_id, temperatura_objetivo');
    if (error) throw new InternalServerErrorException();
    return data;
  }
}
