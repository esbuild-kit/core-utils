import { pathToFileURL } from 'url';
import type { TransformOptions, TransformResult } from 'esbuild';
import {
	transform as esbuildTransform,
	transformSync as esbuildTransformSync,
	version as esbuildVersion,
} from 'esbuild';
import { transformDynamicImport } from '../transform-dynamic-import';
import { sha1 } from '../utils/sha1';
import { sourcemap } from '../source-map';
import cache from './cache';
import { getEsbuildOptions } from './get-esbuild-options';

// Used by cjs-loader
export function transformSync(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): TransformResult {
	const define: { [key: string]: string } = {};

	if (!(filePath.endsWith('.cjs') || filePath.endsWith('.cts'))) {
		define['import.meta.url'] = `'${pathToFileURL(filePath)}'`;
	}

	const options = getEsbuildOptions({
		sourcefile: filePath,
		define,
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
	const options = getEsbuildOptions({
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
