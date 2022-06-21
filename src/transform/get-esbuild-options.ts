import path from 'path';
import type { TransformOptions } from 'esbuild';

const nodeVersion = process.versions.node;

export const getEsbuildOptions = (
	extendOptions: TransformOptions,
) => {
	const options: TransformOptions = {
		target: `node${nodeVersion}`,

		// "default" tells esbuild to infer loader from file name
		// https://github.com/evanw/esbuild/blob/4a07b17adad23e40cbca7d2f8931e8fb81b47c33/internal/bundler/bundler.go#L158
		loader: 'default',

		sourcemap: true,

		/**
		 * Smaller output for cache and marginal performance improvement:
		 * https://twitter.com/evanwallace/status/1396336348366180359?s=20
		 */
		/**
		 * Disabled until esbuild supports names in source maps:
		 * https://github.com/evanw/esbuild/issues/1296
		 */
		// minify: true, keepNames: true,
		minifySyntax: true,
		minifyWhitespace: true,

		...extendOptions,
	};

	if (options.sourcefile) {
		const { sourcefile } = options;
		const extension = path.extname(sourcefile);

		if (extension) {
			// https://github.com/evanw/esbuild/issues/1932
			if (extension === '.mts') {
				options.loader = 'ts';
				options.format = 'esm';
			} else if (extension === '.cts') {
				options.loader = 'ts';
				options.format = 'cjs';
			}
		} else {
			// esbuild errors to detect loader when a file doesn't have an extension
			options.loader = 'js';
		}
	}

	return options;
};
