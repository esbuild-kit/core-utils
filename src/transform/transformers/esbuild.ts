import { pathToFileURL } from 'url';
import path from 'path';
import type { TransformOptions, TransformResult } from 'esbuild';
// import { transform, transformSync } from 'esbuild';

const nodeVersion = process.versions.node;

export const getTransformOptions = (
	extendOptions: TransformOptions,
) => {

	// const define: { [key: string]: string } = {};

	// if (!(filePath.endsWith('.cjs') || filePath.endsWith('.cts'))) {
	// 	define['import.meta.url'] = `'${pathToFileURL(filePath)}'`;
	// }

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
			if (extension === '.cts' || extension === '.mts') {
				options.sourcefile = `${sourcefile.slice(0, -3)}ts`;
			}
		} else {
			// esbuild errors to detect loader when a file doesn't have an extension
			options.sourcefile += '.js';
		}
	}

	return options;
};

// // Used by cjs-loader
// export function esbuildTransformSync(
// 	code: string,
// 	filePath: string,
// 	options?: TransformOptions,
// ): TransformResult {

// 	// const options = getTransformOptions({
// 	// 	sourcefile: filePath,
// 	// 	define,
// 	// 	...extendOptions,
// 	// });

// 	const transformed = transformSync(code, options);

// 	if (transformed.warnings.length > 0) {
// 		const { warnings } = transformed;
// 		for (const warning of warnings) {
// 			console.log(warning);
// 		}
// 	}

// 	return transformed;
// }

// // Used by esm-loader
// export async function esbuildTransform(
// 	code: string,
// 	filePath: string,
// 	options?: TransformOptions,
// ): Promise<TransformResult> {
// 	// const options = getTransformOptions({
// 	// 	sourcefile: filePath,
// 	// 	...extendOptions,
// 	// });

// 	const transformed = await transform(code, options);

// 	if (transformed.warnings.length > 0) {
// 		const { warnings } = transformed;
// 		for (const warning of warnings) {
// 			console.log(warning);
// 		}
// 	}

// 	return transformed;
// }
