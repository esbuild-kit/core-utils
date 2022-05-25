import path from 'path';

const tsExtensions: Record<string, string> = {
	'.js': '.ts',
	'.cjs': '.cts',
	'.mjs': '.mts',
};

export function resolveTsPath(filePath: string) {
	const extension = path.extname(filePath);
	const tsExtension = tsExtensions[extension];

	if (tsExtension) {
		return `${filePath.slice(0, -extension.length)}${tsExtension}`;
	}
}
