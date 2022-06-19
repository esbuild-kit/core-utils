import remapping, { type SourceMapInput } from '@ampproject/remapping';
import type { SourceMap } from 'magic-string';

type IntersectionArray<T extends unknown[]> = (
	T extends [infer FirstElement, ...infer RestElements]
		? FirstElement & IntersectionArray<RestElements>
		: {}
);

type SM = SourceMapInput | SourceMap;
type Transformed = {
	code: string;
	map: SM;
};

type Transformer<Result extends Transformed> = (code: string) => Result;

type Results<
	Arr extends Transformer<any>[]
> = IntersectionArray<{
	[Key in keyof Arr]: (
		Arr[Key] extends Transformer<infer ReturnType>
			? ReturnType
			: unknown
	);
}>;

export function applyTransformersSync<
	T extends Readonly<Transformer<any>[]>,
>(
	code: string,
	transformers: T,
): Results<[...T]> {
	const maps: SM[] = [];
	const result = {
		code,
		map: '',
	};

	for (const transformer of transformers) {
		const transformed = transformer(result.code);
		Object.assign(result, transformed);
		maps.unshift(transformed.map);
	}

	result.map = remapping(maps, () => null).toString();

	return result as unknown as Results<[...T]>;
}


// const b = applyTransformersSync('', [
// 	(code: string) => ({ code: 'a', map: '',  }),
// 	(code: string) => ({ code: 'b', map: '', b: 2, c: 3, d: 4 }),
// ] as const);

// console.log(b);

// b.b



// function asdf<
// 	T extends Readonly<any[]>
// > (
// 	arr: T
// ): IntersectionArray<[...T]>


// const a = asdf([
// 	{ a: 1 },
// 	{ b: 2 },
// ]as const);



// type B = typeof a;
// type A = IntersectionArray<[{ a: 1 }, {b: 2}]>;
