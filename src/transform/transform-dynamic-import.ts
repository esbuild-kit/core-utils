import MagicString from 'magic-string';
import type { EncodedSourceMap } from '@ampproject/remapping';
import { parseEsm } from '../utils/es-module-lexer';
import { applySourceMap } from '../source-map';

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
	{ code }: { code: string },
	sourcemap?: boolean | 'inline',
) {
	code = code.toString();

	// Naive check
	if (!code.includes('import')) {
		return;
	}

	const [imports] = parseEsm(code);

	if (imports.length === 0) {
		return;
	}

	const magicString = new MagicString(code);

	for (const dynamicImport of imports) {
		if (dynamicImport.d > -1) {
			magicString.appendRight(dynamicImport.se, checkEsModule);
		}
	}

	const transformed = {
		code: magicString.toString(),
		map: magicString.generateMap({ hires: true }) as EncodedSourceMap,
	};

	if (!sourcemap) {
		applySourceMap(transformed);
	}

	return transformed;
}
