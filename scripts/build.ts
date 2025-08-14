import { build, type BuildOptions } from 'esbuild';

const entryFile = 'src/index.ts';

const opts: BuildOptions = {
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',

	// minifySyntax: true,
	// minifyIdentifiers: true,
};

const node: BuildOptions = {
	platform: 'node',
	minifySyntax: true,
	packages: 'external',
};

const browser: BuildOptions = {
	platform: 'browser',
	entryPoints: { 'tubechat': entryFile },
};

const esm: BuildOptions = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

const esm_min: BuildOptions = {
	...esm,
	minify: true,
};

const cjs: BuildOptions = {
	format: 'cjs',
	outExtension: { '.js': '.cjs' },
};

const iife: BuildOptions = {
	format: 'iife',
	globalName: 'tubechat',
	outExtension: { '.js': '.js' },
};

const iife_min: BuildOptions = {
	...iife,
	minify: true,
};

// Node - ESM & CJS
// tubechat.node.mjs
build({ ...opts, ...node,    ...esm,      entryPoints: { 'tubechat.node': entryFile } });
// tubechat.node.cjs
build({ ...opts, ...node,    ...cjs,      entryPoints: { 'tubechat.node': entryFile } });

// Browser - ESM & IIFE, with & without minification
// tubechat.browser.mjs
build({ ...opts, ...browser, ...esm,      entryPoints: { 'tubechat.browser': entryFile } });
// tubechat.browser.min.mjs
build({ ...opts, ...browser, ...esm_min,  entryPoints: { 'tubechat.browser.min': entryFile } });
// tubechat.browser-global.js
build({ ...opts, ...browser, ...iife,     entryPoints: { 'tubechat.browser-global': entryFile } });
// tubechat.browser-global.min.js
build({ ...opts, ...browser, ...iife_min, entryPoints: { 'tubechat.browser-global.min': entryFile } });