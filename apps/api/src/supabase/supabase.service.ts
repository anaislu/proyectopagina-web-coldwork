import { Inject, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { APP_ENV, type AppEnv } from '../config/env';

/**
 * Estrategia RLS: el API NUNCA usa la service_role/secret key para atender
 * peticiones de usuarios. Cada request crea un cliente con la clave pública
 * + el JWT del usuario, de modo que Postgres evalúa las políticas RLS con
 * auth.uid() y el claim app_role del propio usuario.
 */
@Injectable()
export class SupabaseService {
  /** Cliente anónimo, solo para verificar JWTs (JWKS cacheado). */
  private readonly verifier: ReturnType<typeof createClient>;

  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {
    this.verifier = createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** Verifica firma + expiración del JWT contra las signing keys del proyecto. */
  async verify(jwt: string) {
    const { data, error } = await this.verifier.auth.getClaims(jwt);
    if (error || !data) return null;
    return data.claims;
  }

  /** Cliente con identidad del usuario: todas las queries pasan por RLS. */
  forUser(jwt: string): ReturnType<typeof createClient> {
    return createClient(this.env.supabaseUrl, this.env.supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
