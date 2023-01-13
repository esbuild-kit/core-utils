import type { Loader } from 'esbuild';

const loaderMap = (() => {
	const map = new Map<string, Loader>();

	if (process.env.ESBK_LOADER_MAP) {
		const entries = process.env.ESBK_LOADER_MAP.split(',');

		for (const entry of entries) {
			const [extension, loader] = entry.trim().split('=');
			map.set(extension, loader as Loader);
		}
	}

	return map;
})();

export const getLoader = (extension?: string): Loader => {
	const override = extension ? loaderMap.get(extension) : undefined;

	// "default" tells esbuild to infer loader from file name
	// https://github.com/evanw/esbuild/blob/4a07b17adad23e40cbca7d2f8931e8fb81b47c33/internal/bundler/bundler.go#L158
	return override ?? 'default';
};
