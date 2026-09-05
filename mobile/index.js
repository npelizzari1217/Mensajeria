/**
 * Punto de entrada de la app.
 *
 * Registra el componente raíz definido en `app/index.tsx`.
 *
 * Este archivo reemplaza el entry por defecto de Expo,
 * `node_modules/expo/AppEntry.js`, que resuelve su componente raíz a través de
 * la ruta física `../../App`. Ese default nunca coincidió con este proyecto: el
 * componente raíz vive en `app/index.tsx` y acá nunca existió un `App.tsx` en la
 * raíz. Además la ruta física se rompe bajo pnpm, donde `node_modules/expo` es
 * un symlink al store virtual.
 */
import { registerRootComponent } from 'expo';

import App from './app/index';

registerRootComponent(App);
