import { parse } from 'es-module-lexer';
import MagicString from 'magic-string';

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
	code: string | Buffer,
) {
	code = code.toString();

	// Naive check
	if (!code.includes('import')) {
		return;
	}

	const parsed = parse(code);

	// Uninitialized
	if ('then' in parsed) {
		return;
	}

	const [imports] = parsed;
	if (imports.length === 0) {
		return;
	}

	const transform = new MagicString(code);

	// Only dynamic imports should be left post-transform
	for (const dynamicImport of imports) {
		if (dynamicImport.d > -1) {
			transform.appendRight(dynamicImport.se, checkEsModule);
		}
	}

	return {
		code: transform.toString(),
	};
}
