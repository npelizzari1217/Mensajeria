const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// Monorepo root is two levels up (mobile/ → Mensajeria/)
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the full monorepo so Metro resolves @mensajeria/domain from packages/
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both project and workspace roots
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Required for pnpm symlinks + package.json "exports" field resolution
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
