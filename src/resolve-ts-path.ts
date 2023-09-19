import path from 'path';

const tsExtensions: Record<string, string[]> = Object.create(null);
tsExtensions['.js'] = ['.ts', '.tsx', '.js', '.jsx'];
tsExtensions['.jsx'] = ['.tsx', '.ts', '.jsx', '.js'];
tsExtensions['.cjs'] = ['.cts'];
tsExtensions['.mjs'] = ['.mts'];

export const resolveTsPath = (
	filePath: string,
) => {
	const extension = path.extname(filePath);
	const [extensionNoQuery, query] = path.extname(filePath).split('?');
	const tsExtension = tsExtensions[extensionNoQuery];

	if (tsExtension) {
		const extensionlessPath = filePath.slice(0, -extension.length);
		return tsExtension.map(
			(tsExtension) => (
				extensionlessPath
				+ tsExtension
				+ (query ? `?${query}` : '')
			)
		);
	}
};
