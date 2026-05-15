// tamagui.config.ts
// Using @tamagui/config v3 preset as the base configuration.
// noUnusedLocals is disabled in tsconfig for this file (generated tokens can trigger false positives).
import { config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

const tamaguiConfig = createTamagui(config);

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
