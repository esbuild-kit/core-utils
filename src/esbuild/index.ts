import path from 'path';
import type { TransformOptions, TransformResult } from 'esbuild';
import {
	transform as esbuildTransform,
	transformSync as esbuildTransformSync,
	version as esbuildVersion,
} from 'esbuild';
import { transformDynamicImport } from '../transform-dynamic-import';
import { sha1 } from '../utils/sha1';
import { hasNativeSourceMapSupport } from '../utils/has-native-source-map-support';
import cache from './cache';

const nodeVersion = process.versions.node;

const sourcemap = hasNativeSourceMapSupport ? 'inline' : true;

const getTransformOptions = (
	extendOptions: TransformOptions,
) => {
	const options: TransformOptions = {
		target: `node${nodeVersion}`,

		// "default" tells esbuild to infer loader from file name
		// https://github.com/evanw/esbuild/blob/4a07b17adad23e40cbca7d2f8931e8fb81b47c33/internal/bundler/bundler.go#L158
		loader: 'default',

		sourcemap,

		// Marginal performance improvement:
		// https://twitter.com/evanwallace/status/1396336348366180359?s=20
		// Smaller output for cache
		minify: true,
		keepNames: true,

		...extendOptions,
	};

	if (options.sourcefile) {
		let { sourcefile } = options;

		const extension = path.extname(sourcefile);

		if (extension) {
			// https://github.com/evanw/esbuild/issues/1932
			if (extension === '.cts' || extension === '.mts') {
				sourcefile = `${sourcefile.slice(0, -3)}ts`;
			}
		} else {
			// esbuild errors to detect loader when a file doesn't have an extension
			sourcefile += '.js';
		}

		options.sourcefile = sourcefile;
	}

	return options;
};

// Used by cjs-loader
export function transformSync(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): TransformResult {
	const options = getTransformOptions({
		sourcefile: filePath,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(options) + esbuildVersion);
	const cacheHit = cache.get(hash);
	if (cacheHit) {
		return cacheHit;
	}

	const transformed = esbuildTransformSync(code, options);

	const dynamicImportTransformed = transformDynamicImport(transformed, sourcemap);
	if (dynamicImportTransformed) {
		transformed.code = dynamicImportTransformed.code;
		transformed.map = dynamicImportTransformed.map;
	}

	if (transformed.warnings.length > 0) {
		const { warnings } = transformed;
		for (const warning of warnings) {
			console.log(warning);
		}
	}

	cache.set(hash, transformed);

	return transformed;
}

// Used by esm-loader
export async function transform(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): Promise<TransformResult> {
	const options = getTransformOptions({
		sourcefile: filePath,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(options) + esbuildVersion);
	const cacheHit = cache.get(hash);
	if (cacheHit) {
		return cacheHit;
	}

	const transformed = await esbuildTransform(code, options);

	const dynamicImportTransformed = transformDynamicImport(transformed, sourcemap);
	if (dynamicImportTransformed) {
		transformed.code = dynamicImportTransformed.code;
		transformed.map = dynamicImportTransformed.map;
	}

	if (transformed.warnings.length > 0) {
		const { warnings } = transformed;
		for (const warning of warnings) {
			console.log(warning);
		}
	}

	cache.set(hash, transformed);

	return transformed;
}
