# Coldwork ERP

[![CI](https://github.com/anaislu/proyectopagina-web-coldwork/actions/workflows/ci.yml/badge.svg)](https://github.com/anaislu/proyectopagina-web-coldwork/actions/workflows/ci.yml)

ERP transaccional para refrigeración y packings.

| App | Stack | Ruta |
|---|---|---|
| Frontend | Angular 20 | `apps/web` |
| API | NestJS 11 | `apps/api` |
| IA | FastAPI (Python 3.13) | `apps/ai` |
| Base de datos | Supabase (Postgres + RLS) | `supabase/` |

Arquitectura, redes, secretos y RLS: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
