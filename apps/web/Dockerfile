# syntax=docker/dockerfile:1.7
# ---------- deps: capa cacheable, solo cambia si cambia el lockfile ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---------- build ----------
FROM deps AS build
COPY . .
RUN npx ng build --configuration production

# ---------- runtime: nginx sin root, solo estáticos ----------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
ENV NGINX_ENVSUBST_FILTER="^SUPABASE_"
COPY --chown=101:101 docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=101:101 /app/dist/web/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
