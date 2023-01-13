import type { Loader } from 'esbuild';

const loaderMap = new Map<string, Loader>();
let parsedEnv: string | undefined;

const parseEnv = () => {
	if (parsedEnv === process.env.ESBK_LOADER_MAP) {
		return;
	}

	loaderMap.clear();
	parsedEnv = process.env.ESBK_LOADER_MAP;

	if (parsedEnv) {
		const entries = parsedEnv.split(',');

		for (const entry of entries) {
			const [extension, loader] = entry.trim().split('=');
			loaderMap.set(extension, loader as Loader);
		}
	}
};

export const getLoader = (extension?: string): Loader => {
	parseEnv();
	const override = extension ? loaderMap.get(extension) : undefined;

	// "default" tells esbuild to infer loader from file name
	// https://github.com/evanw/esbuild/blob/4a07b17adad23e40cbca7d2f8931e8fb81b47c33/internal/bundler/bundler.go#L158
	return override ?? 'default';
};
