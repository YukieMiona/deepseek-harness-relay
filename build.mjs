import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  target: 'es2024',
  format: 'esm',
  sourcemap: true,
  packages: 'external',
});
console.log('Successfully built lib/index.js via esbuild!');
