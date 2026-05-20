# Learning: Prisma Client no generado — RefreshToken no persistía

**Date**: 2026-05-16
**Context**: Refresh token no se guardaba en DB al hacer login. La tabla `refresh_tokens` existía en PostgreSQL pero el modelo `RefreshToken` no estaba disponible en runtime.

**Discovery**: `pnpm prisma generate` escribía el cliente al store global de pnpm en lugar de a `node_modules/.prisma/client`. El import `@prisma/client` resolvía a una versión sin el modelo nuevo. Esto es un bug conocido de pnpm con Prisma en monorepos.

**Solution**: 
1. Agregar `"postinstall": "prisma generate"` en `api/package.json`
2. Configurar `prisma.schema` con output explícito: `generator client { output = "../node_modules/.prisma/client" }`
3. Agregar `@prisma/client` como dependency explícita de la raíz

**Affected**: api/prisma/schema.prisma, api/package.json, pnpm-workspace.yaml
**Gotcha**: `prisma migrate deploy` NO genera el cliente. Siempre correr `prisma generate` después de migraciones que agreguen nuevos modelos.
