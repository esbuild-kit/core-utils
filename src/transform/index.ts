import { pathToFileURL } from 'url';
import path from 'path';
import { sha1 } from '../utils/sha1';
import { hasNativeSourceMapSupport } from '../utils/has-native-source-map-support';
import cache from './cache';
// import { esbuildTransformSync, esbuildTransform } from '../transformers/esbuild';
import { interopDynamicImports } from './transformers/interop-dynamic-import';
import { applyTransformersSync } from './apply-transformers';
import {
	transformSync as esbuildTransformSync,
	version as esbuildVersion,
} from 'esbuild';

const sourcemap = hasNativeSourceMapSupport ? 'inline' : true;

// Used by cjs-loader
export function transformSync(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): TransformResult {

	const options = getTransformOptions({
		sourcefile: filePath,
		define,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(options) + esbuildVersion);
	const cacheHit = cache.get(hash);
	if (cacheHit) {
		return cacheHit;
	}

	const transformed = applyTransformersSync(code, [
		(code) => esbuildTransformSync(code, options),
		interopDynamicImports,
	] as const);

	if ('warnings' in transformed) {
		console.log(transformed);
	}

	// const transformed = esbuildTransformSync(code, options);

	// const dynamicImportTransformed = interopDynamicImports(transformed, sourcemap);
	// if (dynamicImportTransformed) {
	// 	transformed.code = dynamicImportTransformed.code;
	// 	transformed.map = dynamicImportTransformed.map;
	// }

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

	// const transformed = await esbuildTransform(code, options);

	// const dynamicImportTransformed = interopDynamicImports(transformed, sourcemap);
	// if (dynamicImportTransformed) {
	// 	transformed.code = dynamicImportTransformed.code;
	// 	transformed.map = dynamicImportTransformed.map;
	// }

	cache.set(hash, transformed);

	return transformed;
}
