import sourceMapSupport from 'source-map-support';
import { hasNativeSourceMapSupport } from './utils/has-native-source-map-support';

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
