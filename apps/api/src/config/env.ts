/**
 * Validación fail-fast de configuración. Si falta una variable, el contenedor
 * no arranca (mejor un crash en el deploy que un 500 en producción).
 * Los secretos se leen preferentemente desde archivos (Docker secrets, *_FILE).
 */
import { readFileSync } from 'node:fs';

function read(name: string, required = true): string {
  const fromFile = process.env[`${name}_FILE`];
  const value = fromFile
    ? readFileSync(fromFile, 'utf8').trim()
    : process.env[name];
  if (required && !value) {
    throw new Error(
      `Variable de entorno requerida ausente: ${name} (o ${name}_FILE)`,
    );
  }
  return value ?? '';
}

export interface AppEnv {
  port: number;
  supabaseUrl: string;
  /** Clave pública (anon / sb_publishable_*). Respeta RLS. */
  supabasePublishableKey: string;
  /** Token compartido para llamar al servicio de IA en la red interna. */
  aiInternalToken: string;
  aiBaseUrl: string;
  corsOrigins: string[];
}

export function loadEnv(): AppEnv {
  return {
    port: Number(process.env.PORT ?? 3000),
    supabaseUrl: read('SUPABASE_URL'),
    supabasePublishableKey: read('SUPABASE_PUBLISHABLE_KEY'),
    aiInternalToken: read('AI_INTERNAL_TOKEN'),
    aiBaseUrl: process.env.AI_BASE_URL ?? 'http://ai:8000',
    corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  };
}

export const APP_ENV = Symbol('APP_ENV');
