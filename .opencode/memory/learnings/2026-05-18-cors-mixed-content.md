# Learning: CORS Mixed Content Block en Producción

**Date**: 2026-05-18
**Context**: Web (sesitec.net HTTPS) llamando a API (86.48.23.197 HTTP)
**Discovery**: Los navegadores bloquean requests HTTP desde páginas HTTPS (mixed content). La app web en Hostinger (HTTPS) no podía llamar directamente a la API en el VPS Windows (HTTP).

**Solution**: Se implementó un PHP reverse proxy en Hostinger que recibe requests HTTPS y los reenvía a la API HTTP. El frontend apunta a `/v1/*` (mismo origen) y el proxy PHP en el servidor shared hosting resuelve al VPS.

```php
// v1-proxy.php en Hostinger
$api_url = 'http://86.48.23.197/v1/' . $_GET['path'];
echo file_get_contents($api_url, false, stream_context_create([
    'http' => ['method' => $_SERVER['REQUEST_METHOD'], ...]
]));
```

**Affected**: web/.env.production, deploy/v1-proxy.php, web/nginx.conf
**Gotcha**: El orden de las rewrite rules en .htaccess es crítico — la regla del proxy PHP debe evaluarse ANTES que la regla catch-all del SPA.
