import remapping from '@ampproject/remapping';
import type { SourceMapInput } from '@ampproject/remapping';

type MaybePromise<T> = T | Promise<T>;

type IntersectionArray<T extends unknown[]> = (
	T extends [infer FirstElement, ...infer RestElements]
		? FirstElement & IntersectionArray<RestElements>
		: unknown
);

type Transformed = {
	code: string;
	map: SourceMapInput;
};

type TransformerResult = Transformed | undefined;

type Transformer<
	Result extends MaybePromise<TransformerResult> = TransformerResult
> = (
	filePath: string,
	code: string,
) => Result;

type Results<
	Array_ extends Transformer<MaybePromise<TransformerResult>>[]
> = IntersectionArray<{
	[Key in keyof Array_]: (
		Array_[Key] extends Transformer<infer ReturnType>
			? ReturnType
			: unknown
	);
}>;

type AddSourceMap<T> = Omit<T, 'map'> & { map: string };

export function applyTransformersSync<
	T extends Readonly<Transformer[]>,
>(
	filePath: string,
	code: string,
	transformers: T,
) {
	const maps: SourceMapInput[] = [];
	const result = {
		code,
		map: '',
	};

	for (const transformer of transformers) {
		const transformed = transformer(filePath, result.code);

		if (transformed) {
			Object.assign(result, transformed);
			maps.unshift(transformed.map);
		}
	}

	result.map = (
		maps.length > 1
			? remapping(maps, () => null).toString()
			: maps[0].toString()
	);

	return result as unknown as AddSourceMap<Results<[...T]>>;
}

export async function applyTransformers<
	T extends Readonly<Transformer<MaybePromise<TransformerResult>>[]>,
>(
	filePath: string,
	code: string,
	transformers: T,
) {
	const maps: SourceMapInput[] = [];
	const result = {
		code,
		map: '',
	};

	for (const transformer of transformers) {
		const transformed = await transformer(filePath, result.code);

		if (transformed) {
			Object.assign(result, transformed);
			maps.unshift(transformed.map);
		}
	}

	result.map = (
		maps.length > 1
			? remapping(maps, () => null).toString()
			: maps[0].toString()
	);

	return result as unknown as AddSourceMap<Results<[...T]>>;
}
