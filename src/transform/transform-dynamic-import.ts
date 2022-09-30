import MagicString from 'magic-string';
import type { EncodedSourceMap } from '@ampproject/remapping';
import { parseEsm } from '../utils/es-module-lexer';

// Necessary for types to build correctly
export type { EncodedSourceMap };

const checkEsModule = `.then((mod)=>{
	const exports = Object.keys(mod);
	if(
		exports.length===1&&exports[0]==='default'&&mod.default.__esModule
	){
		return mod.default
	}
	return mod
})`.replace(/[\n\t]+/g, '');

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

	for (const dynamicImport of dynamicImports) {
		magicString.appendRight(dynamicImport.se, checkEsModule);
	}

	return {
		code: magicString.toString(),
		map: magicString.generateMap({
			source: filePath,
			hires: true,
		}) as EncodedSourceMap,
	};
}
