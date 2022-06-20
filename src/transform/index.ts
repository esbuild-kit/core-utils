import { pathToFileURL } from 'url';
import type { TransformOptions } from 'esbuild';
import {
	transform as esbuildTransform,
	transformSync as esbuildTransformSync,
	version as esbuildVersion,
} from 'esbuild';
import { sha1 } from '../utils/sha1';
import { applySourceMap } from '../source-map';
import { transformDynamicImport } from './transform-dynamic-import';
import cache from './cache';
import { applyTransformersSync, applyTransformers } from './apply-transformers';
import { getEsbuildOptions } from './get-esbuild-options';

export * from './transform-dynamic-import';

// Used by cjs-loader
export function transformSync(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
	sourcemaps?: Map<string, string>,
): string {
	const define: { [key: string]: string } = {};

	if (!(filePath.endsWith('.cjs') || filePath.endsWith('.cts'))) {
		define['import.meta.url'] = `'${pathToFileURL(filePath)}'`;
	}

	const esbuildOptions = getEsbuildOptions({
		sourcefile: filePath,
		define,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(esbuildOptions) + esbuildVersion);
	const cacheHit = cache.get(hash);

	if (cacheHit) {
		return applySourceMap(cacheHit, filePath, sourcemaps);
	}

	const transformed = applyTransformersSync(
		code,
		[
			// eslint-disable-next-line @typescript-eslint/no-shadow
			code => esbuildTransformSync(code, esbuildOptions),
			transformDynamicImport,
		] as const,
	);

	if (transformed.warnings.length > 0) {
		const { warnings } = transformed;
		for (const warning of warnings) {
			console.log(warning);
		}
	}

	cache.set(hash, transformed);

	return applySourceMap(transformed, filePath, sourcemaps);
}

// Used by esm-loader
export async function transform(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
	sourcemaps?: Map<string, string>,
): Promise<string> {
	const esbuildOptions = getEsbuildOptions({
		sourcefile: filePath,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(esbuildOptions) + esbuildVersion);
	const cacheHit = cache.get(hash);
	if (cacheHit) {
		return applySourceMap(cacheHit, filePath, sourcemaps);
	}

	const transformed = await applyTransformers(code, [
		// eslint-disable-next-line @typescript-eslint/no-shadow
		code => esbuildTransform(code, esbuildOptions),
		transformDynamicImport,
	] as const);

	if (transformed.warnings.length > 0) {
		const { warnings } = transformed;
		for (const warning of warnings) {
			console.log(warning);
		}
	}

	cache.set(hash, transformed);

	return applySourceMap(transformed, filePath, sourcemaps);
}
