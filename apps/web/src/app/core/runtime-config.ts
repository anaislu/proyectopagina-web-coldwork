/**
 * Configuración inyectada en runtime por nginx (/env.js), no en build:
 * la misma imagen sirve para staging y producción.
 * Solo contiene valores PÚBLICOS (URL + publishable/anon key). Nunca la secret key.
 */
export interface RuntimeConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  apiBaseUrl: string;
}

declare global {
  interface Window {
    __env?: Partial<RuntimeConfig>;
  }
}

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl: window.__env?.supabaseUrl ?? '',
  supabasePublishableKey: window.__env?.supabasePublishableKey ?? '',
  apiBaseUrl: window.__env?.apiBaseUrl ?? '/api',
};
