/**
 * Configuración de Metro para este monorepo pnpm.
 *
 * El `getDefaultConfig(__dirname)` por defecto sólo observa la carpeta del
 * proyecto, así que Metro no puede seguir los symlinks que pnpm crea en
 * `mobile/node_modules`, que apuntan a `<workspace>/node_modules/.pnpm`. Node
 * los resuelve sin problema; Metro no, y falla con
 * "could not be found within the project".
 *
 * Agregar la raíz del workspace a `watchFolders` y ambas carpetas
 * `node_modules` a `nodeModulesPaths` es la configuración de monorepo que
 * documenta Expo.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
