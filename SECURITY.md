# Security policy

Politique 2027 is a static website: there is no account, no form, no database and no server-side code. The game runs entirely in the browser and stores its progress in `localStorage`.

## Reporting a vulnerability

Please report security issues **privately**, through the contact form at <https://mbonnici.fr/en/contact>, rather than in a public issue. Include the affected URL or file and the steps to reproduce. You will get an answer as soon as possible.

Only the latest released version is supported.

## What is in place

- **No third-party code or requests at runtime.** Fonts, scripts and images are served from the site itself; a browser test fails if any page contacts another origin or sets a cookie.
- **Content-Security-Policy** with per-page hashes (no `unsafe-inline`, no `unsafe-eval`), plus `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` and `object-src 'none'` sent as a header.
- **HSTS**, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` on every response.
- **nginx** answers `GET` and `HEAD` only, hides its version, serves no dotfile and keeps no access log.
- **Container**: non-root user, read-only root filesystem, all Linux capabilities dropped, `no-new-privileges`. The image is the slim nginx variant, with Alpine security upgrades applied at build time.
- **Dependencies**: nothing third-party ships to the browser besides the self-hosted fonts. `npm audit` and an image scan (Trivy) are run before each release.

## Known and accepted

- `?e2e=1` exposes a test handle (`window.__P2027__`) that can drive a match. The game is single-player and client-side, so this only lets players cheat against themselves — exactly what editing `localStorage` already allows.
- Base images use floating tags (`node:24-alpine`, `nginxinc/nginx-unprivileged:stable-alpine-slim`) so that a rebuild picks up security patches. Rebuild the image regularly.
