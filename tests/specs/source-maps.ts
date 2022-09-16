import { testSuite, expect } from 'manten';
import { createFsRequire } from 'fs-require';
import { Volume } from 'memfs';
import {
	transformSync,
	installSourceMapSupport,
	applySourceMap,
} from '#esbuild-kit/core-utils';

// Native source maps disabled in ./tests/index.ts
const sourcemaps = installSourceMapSupport();

export default testSuite(({ describe }) => {
	describe('source map', ({ test }) => {
		test('sourcemap file', () => {
			const fileName = 'file.mts';
			const transformed = transformSync(
				'let nameInError;\nnameInError();',
				fileName,
				{ format: 'cjs' },
			);

			const fsRequire = createFsRequire(Volume.fromJSON({
				'/file.mts': applySourceMap(
					transformed,
					`fs-require://2/${fileName}`,
					sourcemaps,
				),
			}));

			try {
				fsRequire(`/${fileName}`);
			} catch (error) {
				const { stack } = error as any;
				expect(stack).toMatch('nameInError');
				expect(stack).toMatch(`${fileName}:2:13`);
			}
		});
	});
});
