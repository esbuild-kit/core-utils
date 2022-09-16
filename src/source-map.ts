import sourceMapSupport from 'source-map-support';
import type { SourceMapInput } from '@ampproject/remapping';

export function installSourceMapSupport() {
	const hasNativeSourceMapSupport = (
		/**
		 * Check if native source maps are supported by seeing if the API is available
		 * https://nodejs.org/dist/latest-v18.x/docs/api/process.html#processsetsourcemapsenabledval
		 */
		'setSourceMapsEnabled' in process

		/**
		 * Overriding Error.prepareStackTrace prevents --enable-source-maps from modifying
		 * the stack trace
		 * https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#:~:text=Overriding%20Error.prepareStackTrace%20prevents%20%2D%2Denable%2Dsource%2Dmaps%20from%20modifying%20the%20stack%20trace.
		 *
		 * https://github.com/nodejs/node/blob/91193825551f9301b6ab52d96211b38889149892/lib/internal/errors.js#L141
		 */
		&& typeof Error.prepareStackTrace !== 'function'
	);

	if (hasNativeSourceMapSupport) {
		process.setSourceMapsEnabled(true);
		return;
	}

	const sourcemaps = new Map<string, string>();

	sourceMapSupport.install({
		environment: 'node',
		retrieveSourceMap(url) {
			const map = sourcemaps.get(url);
			return map ? { url, map } : null;
		},
	});

	return sourcemaps;
}

const inlineSourceMapPrefix = '\n//# sourceMappingURL=data:application/json;base64,';

export function applySourceMap(
	{ code, map }: { code: string; map: SourceMapInput },
	filePath: string,
	sourcemaps?: Map<string, string>,
) {
	const mapString = (typeof map === 'string' ? map : map.toString());

	if (sourcemaps) {
		sourcemaps.set(filePath, mapString);
		return code;
	}

	return code + inlineSourceMapPrefix + Buffer.from(mapString, 'utf8').toString('base64');
}
