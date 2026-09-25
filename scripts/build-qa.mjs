// Compiles src/data/interactions.ts to dist-qa/interactions.js for the smoke test.
import { build } from 'vite';
await build({ configFile: false, logLevel: 'error', build: { lib: { entry: 'src/data/interactions.ts', formats: ['es'], fileName: () => 'interactions.js' }, outDir: 'dist-qa', emptyOutDir: true } });
