import { spawnSync } from 'child_process';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import {
	transformSync,
	installSourceMapSupport,
} from '#esbuild-kit/core-utils';

const applySourceMap = installSourceMapSupport();

export default testSuite(({ describe }) => {
	describe('source map', ({ test }) => {
		test('sourcemap file', async () => {
			const rawFile = 'raw.js';
			const code = 'let nameInError;\n\n\n    nameInError();';
			const transformedFile = 'transformed.mts';
			const transformed = transformSync(
				code,
				transformedFile,
				{ format: 'cjs' },
			);

			const fixture = await createFixture({
				[rawFile]: code,
				[transformedFile]: applySourceMap(transformed, ''),
			});

			const expected = spawnSync(process.execPath, [path.join(fixture.path, rawFile)]);
			const received = spawnSync(process.execPath, ['--enable-source-maps', path.join(fixture.path, transformedFile)]);

			await fixture.rm();

			const stderrReceived = received.stderr.toString();
			expect(stderrReceived).toMatch('nameInError');

			const errorPosition = expected.stderr.toString().match(new RegExp(`${rawFile}(:\\d+:\\d+)`));
			expect(stderrReceived).toMatch(transformedFile + errorPosition![1]);
		});
	});
});
