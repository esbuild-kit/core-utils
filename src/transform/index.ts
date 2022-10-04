import { pathToFileURL } from 'url';
import type { TransformOptions } from 'esbuild';
import {
	transform as esbuildTransform,
	transformSync as esbuildTransformSync,
	version as esbuildVersion,
} from 'esbuild';
import { sha1 } from '../utils/sha1';
import { transformDynamicImport } from './transform-dynamic-import';
import cache from './cache';
import {
	applyTransformersSync,
	applyTransformers,
	type Transformed,
} from './apply-transformers';
import { getEsbuildOptions } from './get-esbuild-options';

export { transformDynamicImport } from './transform-dynamic-import';

// Used by cjs-loader
export function transformSync(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): Transformed {
	const define: { [key: string]: string } = {};

	if (!(filePath.endsWith('.cjs') || filePath.endsWith('.cts'))) {
		define['import.meta.url'] = `'${pathToFileURL(filePath)}'`;
	}

	const esbuildOptions = getEsbuildOptions({
		format: 'cjs',
		sourcefile: filePath,
		define,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(esbuildOptions) + esbuildVersion);
	const cacheHit = cache.get(hash);

	if (cacheHit) {
		return cacheHit;
	}

	const transformed = applyTransformersSync(
		filePath,
		code,
		[
			// eslint-disable-next-line @typescript-eslint/no-shadow
			(filePath, code) => {
				// eslint-disable-next-line @typescript-eslint/no-shadow
				const transformed = esbuildTransformSync(code, esbuildOptions);
				if (esbuildOptions.sourcefile !== filePath) {
					transformed.map = transformed.map.replace(`"${esbuildOptions.sourcefile}"`, `"${filePath}"`);
				}
				return transformed;
			},
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

	return transformed;
}

// Used by esm-loader
export async function transform(
	code: string,
	filePath: string,
	extendOptions?: TransformOptions,
): Promise<Transformed> {
	const esbuildOptions = getEsbuildOptions({
		format: 'esm',
		sourcefile: filePath,
		...extendOptions,
	});

	const hash = sha1(code + JSON.stringify(esbuildOptions) + esbuildVersion);
	const cacheHit = cache.get(hash);
	if (cacheHit) {
		return cacheHit;
	}

	const transformed = await applyTransformers(
		filePath,
		code,
		[
			// eslint-disable-next-line @typescript-eslint/no-shadow
			async (filePath, code) => {
				// eslint-disable-next-line @typescript-eslint/no-shadow
				const transformed = await esbuildTransform(code, esbuildOptions);
				if (esbuildOptions.sourcefile !== filePath) {
					transformed.map = transformed.map.replace(`"${esbuildOptions.sourcefile}"`, `"${filePath}"`);
				}
				return transformed;
			},
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

	return transformed;
}
