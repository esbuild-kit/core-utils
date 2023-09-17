import path from 'path';

const tsExtensions: Record<string, string> = {
	'.js': '.ts',
	'.cjs': '.cts',
	'.mjs': '.mts',
};

export const resolveTsPath = (
	filePath: string,
) => {
	const extension = path.extname(filePath);
	const [extensionNoQuery, query] = path.extname(filePath).split('?');
	const tsExtension = tsExtensions[extensionNoQuery];

	if (tsExtension) {
		return filePath.slice(0, -extension.length) + tsExtension + (query ? `?${query}` : '');
	}
};
