import MagicString from 'magic-string';
import type { RawSourceMap } from '../source-map';
import { parseEsm } from '../utils/es-module-lexer';

const checkEsModule = `.then((mod)=>{
	const exports = Object.keys(mod);
	if(
		exports.length===1&&exports[0]==='default'&&mod.default.__esModule
	){
		return mod.default
	}
	return mod
})`.replaceAll(/[\n\t]+/g, '');

export function transformDynamicImport(
	filePath: string,
	code: string,
) {
	// Naive check
	if (!code.includes('import')) {
		return;
	}

	const dynamicImports = parseEsm(code)[0].filter(maybeDynamic => maybeDynamic.d > -1);

	if (dynamicImports.length === 0) {
		return;
	}

	const magicString = new MagicString(code);

	console.log(dynamicImports);
	for (const dynamicImport of dynamicImports) {
		console.log(code.slice(dynamicImport.ss, dynamicImport.se));
		magicString.appendRight(dynamicImport.se, checkEsModule);
	}

	return {
		code: magicString.toString(),
		map: magicString.generateMap({
			source: filePath,
			hires: true,
		}) as unknown as RawSourceMap,
	};
}
