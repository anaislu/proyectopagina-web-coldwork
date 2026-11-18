# Coldwork ERP: arquitectura de despliegue

## 1. Red y contenedores

```
                 Internet / LAN
                       │  :8080 (único puerto publicado)
              ┌────────▼────────┐
              │  web (nginx)    │  uid 101 · read-only · Angular estático
              │  /      → SPA   │
              │  /api/* → api   │  reverse proxy
              └────────┬────────┘
       red "edge" (bridge, con salida)
              ┌────────▼────────┐          HTTPS + JWT del usuario
              │  api (NestJS)   │ ───────────────────────────────► Supabase Cloud
              │  uid 1000       │          (PostgREST → Postgres con RLS)
              └────────┬────────┘
       red "backend" (internal: true, SIN salida a internet)
              ┌────────▼────────┐
              │  ai (FastAPI)   │  uid 10001 · solo responde con X-Internal-Token
              └─────────────────┘
```

| Flujo | Permitido | Cómo se garantiza |
|---|---|---|
| Navegador → web | Sí | único `ports:` del compose |
| Navegador → api | Solo vía `/api` en nginx | `api` no publica puertos en producción |
| web → ai | **No** | `web` no está en la red `backend` (DNS `ai` no resuelve) |
| api → ai | Sí | ambos en `backend` + token compartido (Docker secret) |
| ai → internet | **No** | `backend` es `internal: true` |
| api → Supabase | Sí | `edge` tiene salida; el API usa la clave pública + JWT del usuario |

Endurecimiento común (`x-hardening`): `read_only`, `cap_drop: ALL`, `no-new-privileges`,
`init: true`, rotación de logs, healthchecks en todas las imágenes, `tmpfs` solo donde hace falta escribir.

### Supabase y RLS

* **El API no usa la `service_role` / secret key para atender a usuarios.** Crea un cliente por request
  con la clave pública y el header `Authorization: Bearer <jwt del usuario>`. Así Postgres evalúa RLS
  con `auth.uid()` y el claim `app_role`. Aunque el API tenga un bug, no puede leer filas que el usuario no ve.
* El JWT se verifica localmente con `auth.getClaims()` usando las signing keys asimétricas (JWKS) del proyecto,
  así que el API no guarda ningún secreto JWT.
* RBAC en dos capas: `@Roles()` en Nest (deny-by-default con guard global, sirve para errores claros) y RLS
  en Postgres (la capa autoritativa). El rol vive en `public.user_roles` y entra al JWT mediante
  `custom_access_token_hook` (ver `supabase/migrations/`).
* Activar el hook: Dashboard → Authentication → Hooks → *Customize Access Token* → `public.custom_access_token_hook`.

### Secretos

| Valor | Dónde vive | En git |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | `.env` (pública por diseño, protegida por RLS) | No (solo `.env.example`) |
| `AI_INTERNAL_TOKEN` | `secrets/ai_internal_token` → `/run/secrets/` | No (`secrets/.gitignore`) |
| Secret / service_role key | Solo en migraciones/CI de despliegue, **nunca** en contenedores de runtime | No |

## 2. Archivos

| Archivo | Propósito |
|---|---|
| `docker-compose.yml` | Producción (base). `docker compose -f docker-compose.yml up -d` |
| `docker-compose.override.yml` | Desarrollo: hot reload del API, puerto 3000 expuesto, acceso a Supabase local |
| `apps/web/Dockerfile` | node:22-alpine (build) → nginx-unprivileged (runtime, ~80 MB) |
| `apps/web/docker/default.conf.template` | nginx: SPA, proxy `/api`, CSP, `/env.js` con configuración en runtime |
| `apps/api/Dockerfile` | deps → build → prod-deps (sin dev) → runtime como `node` |
| `apps/ai/Dockerfile` | venv en etapa build → runtime slim con uid 10001 |
| `supabase/migrations/*.sql` | Roles, hook de JWT, tablas base y políticas RLS |

## 3. CI

`.github/workflows/ci.yml`: detecta qué app cambió → Angular build · Nest lint/test/build ·
FastAPI ruff/pytest → build de las 3 imágenes Docker (sin push, con caché GHA) → valida ambos compose.
Permisos `contents: read`.

## 4. Puesta en marcha

```bash
cp .env.example .env                       # completar con los valores del proyecto Supabase
openssl rand -hex 32 > secrets/ai_internal_token
docker compose up --build                  # desarrollo
docker compose -f docker-compose.yml up -d --build   # producción
```

Supabase local: `npx supabase init && npx supabase start`, y en `.env` usar
`SUPABASE_URL=http://host.docker.internal:54321`.
