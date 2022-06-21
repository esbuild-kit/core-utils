import { testSuite, expect } from 'manten';
import { createFsRequire } from 'fs-require';
import { Volume } from 'memfs';
import { transform, transformSync } from '../../dist/index.js';

const base64Module = (code: string) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;

const fixtures = {
	ts: `
	export default 'default value' as string;
	export const named: string = 'named';
	`,

	esm: `
	export default 'default value';
	export const named = 'named';
	`,
};

export default testSuite(({ describe }) => {
	describe('transform', ({ describe }) => {
		describe('sync', ({ test }) => {
			test('transforms ESM to CJS', () => {
				const transformed = transformSync(
					fixtures.esm,
					'file.js',
					{
						format: 'cjs',
					},
				);

				const fsRequire = createFsRequire(Volume.fromJSON({
					'/file.js': transformed.code,
				}));

				expect(JSON.stringify(fsRequire('/file.js'))).toBe(
					'{"default":"default value","named":"named"}',
				);
			});

			/*
			test('failing: transforms file with inline sourcemap string', () => {
				expect(
					() => transformSync(
						`const inlineSourceMapPrefix = '\n//# sourceMappingURL=data:application/json;base64,';${
							fixtures.esm
						}`,
						'file.js',
						{
							format: 'cjs',
						},
					),
				).not.toThrow();
			});
			*/

			// test('failing: sourcemap', () => {
			// 	const fileName = 'file.mts';
			// 	const transformed = transformSync(
			// 		fixtures.ts,
			// 		fileName,
			// 		{
			// 			format: 'esm',
			// 		},
			// 	);

			// 	const map = JSON.parse(transformed.map);

			// 	expect(map.sources.length).toBe(1);
			// 	expect(map.sources[0]).toBe(fileName);
			// });
		});

		describe('async', ({ test }) => {
			test('transforms TS to ESM', async () => {
				const transformed = await transform(
					fixtures.ts,
					'file.ts',
					{
						format: 'esm',
					},
				);

				const imported = await import(base64Module(transformed.code));
				expect(JSON.stringify(imported)).toMatch('{"default":"default value","named":"named"}');
			});
		});
	});
});
