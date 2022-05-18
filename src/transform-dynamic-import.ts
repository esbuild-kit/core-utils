import { parse as parseWasm, init } from 'es-module-lexer';
import { parse as parseJs } from 'es-module-lexer/js'; // eslint-disable-line import/no-unresolved
import MagicString from 'magic-string';
import remapping from '@ampproject/remapping';

const checkEsModule = `.then((mod)=>{
	const exports = Object.keys(mod);
	if(
		exports.length===1&&exports[0]==='default'&&mod.default.__esModule
	){
		return mod.default
	}

	return mod
})`.replace(/[\n\t]+/g, '');

let wasmParserInitialized = false;

// eslint-disable-next-line promise/catch-or-return
init.then(() => {
	wasmParserInitialized = true;
});

const inlineSourceMapPrefix = '\n//# sourceMappingURL=data:application/json;base64,';

export function transformDynamicImport(
	{ code, map }: { code: string; map?: string },
	sourcemap?: boolean | 'inline',
) {
	code = code.toString();

	// Naive check
	if (!code.includes('import')) {
		return;
	}

	if (sourcemap === 'inline') {
		const sourceMapIndex = code.indexOf(inlineSourceMapPrefix);
		const inlineSourceMap = code.slice(sourceMapIndex + inlineSourceMapPrefix.length);

		map = Buffer.from(inlineSourceMap, 'base64').toString();
		code = code.slice(0, sourceMapIndex);
	}

	const [imports] = wasmParserInitialized ? parseWasm(code) : parseJs(code);

	if (imports.length === 0) {
		return;
	}

	const magicString = new MagicString(code);

	for (const dynamicImport of imports) {
		if (dynamicImport.d > -1) {
			magicString.appendRight(dynamicImport.se, checkEsModule);
		}
	}

	code = magicString.toString();

	if (sourcemap && map) {
		const generatedMap = magicString.generateMap({ hires: true });

		map = remapping([generatedMap.toString(), map], () => null).toString();

		if (sourcemap === 'inline') {
			code += inlineSourceMapPrefix + Buffer.from(map, 'utf8').toString('base64');
			map = '';
		}
	} else {
		map = '';
	}

	return {
		code,
		map,
	};
}
