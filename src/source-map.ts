import sourceMapSupport from 'source-map-support';
import type { SourceMapInput } from '@ampproject/remapping';

const hasNativeSourceMapSupport = (
	/**
	 * Check if native source maps are supported by seeing if the api is available
	 * https://nodejs.org/dist/latest-v18.x/docs/api/process.html#processsetsourcemapsenabledval
	 */
	'setSourceMapsEnabled' in process

	/**
	 * Overriding Error.prepareStackTrace prevents --enable-source-maps from modifying the stack trace
	 * https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#:~:text=Overriding%20Error.prepareStackTrace%20prevents%20%2D%2Denable%2Dsource%2Dmaps%20from%20modifying%20the%20stack%20trace.
	 *
	 * https://github.com/nodejs/node/blob/91193825551f9301b6ab52d96211b38889149892/lib/internal/errors.js#L141
	 */
	&& typeof Error.prepareStackTrace !== 'function'
);

export function installSourceMapSupport() {
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
	transformed: { code: string; map: SourceMapInput },
) {
	const mapString = (typeof transformed.map === 'string' ? transformed.map : transformed.map.toString());

	if (hasNativeSourceMapSupport) {
		transformed.code = transformed.code + inlineSourceMapPrefix + Buffer.from(mapString, 'utf8').toString('base64');
		transformed.map = '';
	}
}
