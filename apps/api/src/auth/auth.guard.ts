import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { AppRole, IS_PUBLIC_KEY, ROLES_KEY } from './roles';

export interface AuthUser {
  id: string;
  role: AppRole | null;
  jwt: string;
}

/**
 * Guard global: deny-by-default. Toda ruta exige JWT válido salvo @Public().
 * El RBAC en Nest es la primera barrera (UX + errores claros); la barrera
 * autoritativa es RLS en Postgres, que no se puede saltar desde el API.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets))
      return true;

    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    const [scheme, token] = (req.headers['authorization'] ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    const claims = await this.supabase.verify(token);
    if (!claims?.sub) throw new UnauthorizedException();

    const role = (claims['app_role'] as AppRole | undefined) ?? null;
    req.user = { id: claims.sub, role, jwt: token };

    const required = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      targets,
    );
    if (required?.length && (!role || !required.includes(role))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
