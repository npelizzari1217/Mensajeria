#!/usr/bin/env node
/**
 * Verifica que TODOS los workspaces esten cubiertos por las compuertas de calidad.
 *
 * El problema que resuelve: `turbo run test` no falla cuando un paquete no define
 * el script; simplemente no lo cuenta. La salida dice "3 successful, 3 total"
 * habiendo 4 workspaces, y la compuerta pasa en verde sin haber revisado uno.
 * Una lista de lo que se revisa siempre queda vieja; esto afirma completitud.
 *
 * Excluir un workspace es legitimo, pero tiene que estar declarado acá con su
 * motivo por escrito. Exclusion declarada, si. Exclusion silenciosa, no.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Scripts que todo workspace debe declarar para estar cubierto. */
const REQUIRED_SCRIPTS = ['lint', 'test'];

/**
 * Workspaces excluidos, con el motivo. La clave es el `name` del package.json.
 * Un workspace listado acá que YA declare los scripts se reporta como excepcion
 * vencida y hace fallar el check: obliga a limpiar la lista en vez de dejarla crecer.
 */
const EXCEPTIONS = {
  mobile:
    'Tiene tests desde el 2026-09-08 (jest-expo, 6 casos). Sigue sin `lint` ' +
    'porque hoy no typecheckea: 5 errores preexistentes — falta @types/node en ' +
    'app.config.ts y src/api/client.ts, y src/theme/tamagui.config.ts importa ' +
    'tamagui, que no esta instalado y al que nadie referencia. Decision ' +
    'pendiente: instalar los tipos y borrar el archivo huerfano, o declararlo ' +
    'fuera de alcance.',
};

const ROOT = process.cwd();

function listWorkspaces() {
  const raw = execFileSync('pnpm', ['-r', 'list', '--depth', '-1', '--json'], {
    encoding: 'utf8',
    cwd: ROOT,
  });
  // El primer elemento es la raiz del workspace: no es un paquete a revisar.
  return JSON.parse(raw).filter((w) => w.path !== ROOT);
}

function missingScripts(workspacePath) {
  const pkg = JSON.parse(readFileSync(join(workspacePath, 'package.json'), 'utf8'));
  const scripts = pkg.scripts ?? {};
  return REQUIRED_SCRIPTS.filter((s) => !scripts[s]);
}

const workspaces = listWorkspaces();
const uncovered = [];
const staleExceptions = [];
const declared = [];

for (const ws of workspaces) {
  const missing = missingScripts(ws.path);
  const reason = EXCEPTIONS[ws.name];

  if (missing.length === 0) {
    if (reason) staleExceptions.push(ws.name);
    continue;
  }
  if (reason) declared.push({ name: ws.name, missing, reason });
  else uncovered.push({ name: ws.name, missing });
}

const covered = workspaces.length - uncovered.length - declared.length;
console.log(`Workspaces: ${workspaces.length} | cubiertos: ${covered} | excluidos: ${declared.length}`);

for (const d of declared) {
  console.log(`  - ${d.name}: sin [${d.missing.join(', ')}] — excluido: ${d.reason}`);
}

let failed = false;

for (const u of uncovered) {
  console.error(
    `\nERROR: el workspace "${u.name}" no declara [${u.missing.join(', ')}] y no esta ` +
      'declarado como excepcion.\n' +
      '  Las compuertas lo saltean en silencio: pasan en verde sin haberlo revisado.\n' +
      `  Agregale los scripts, o declaralo con su motivo en EXCEPTIONS de ${import.meta.url.split('/').pop()}.`,
  );
  failed = true;
}

for (const name of staleExceptions) {
  console.error(
    `\nERROR: "${name}" figura en EXCEPTIONS pero ya declara todos los scripts.\n` +
      '  Sacalo de la lista: una excepcion vencida esconde la proxima de verdad.',
  );
  failed = true;
}

process.exit(failed ? 1 : 0);
