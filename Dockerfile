# syntax=docker/dockerfile:1

# ── 1. Build the static site ────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

ENV ASTRO_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ── 2. Serve it with nginx, as a non-root user ──────────────────────────────
# "slim" ships nginx without the optional modules (xslt, image filter, njs…)
# and the libraries they drag in: a static site needs none of them.
FROM nginxinc/nginx-unprivileged:stable-alpine-slim AS runtime

# Pull in the Alpine security fixes published since the base image was built.
USER root
RUN apk upgrade --no-cache
USER 101

COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
