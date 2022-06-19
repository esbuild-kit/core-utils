import MagicString from 'magic-string';
import { parseEsm } from '../utils/es-module-lexer';

const checkEsModule = `.then((mod)=>{
	const exports = Object.keys(mod);
	if(
		exports.length===1&&exports[0]==='default'&&mod.default.__esModule
	){
		return mod.default
	}

	return mod
})`.replace(/[\n\t]+/g, '');

export function interopDynamicImports(code: string) {
	code = code.toString();
	return { code, map: '' };

	// // Naive check
	// if (!code.includes('import')) {
	// 	return { code, map: '' };
	// }

	// const [imports] = parseEsm(code);

	// if (imports.length === 0) {
	// 	return { code, map: '' };
	// }

	// const magicString = new MagicString(code);

	// for (const dynamicImport of imports) {
	// 	if (dynamicImport.d > -1) {
	// 		magicString.appendRight(dynamicImport.se, checkEsModule);
	// 	}
	// }

	// return {
	// 	code: magicString.toString(),

	// 	// esbuild returns a string, but this returns a SourceMap instance
	// 	// We can stringify it, but probably faster to leave it parsed
	// 	map: magicString.generateMap({ hires: true }),
	// };
}
