import remapping from '@ampproject/remapping';
import type { SourceMapInput } from '@ampproject/remapping';
import type SourceMap from '@ampproject/remapping/dist/types/source-map';

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
	Result extends MaybePromise<TransformerResult>
> = (
	filePath: string,
	code: string,
) => Result;

type Results<
	Array_ extends Transformer<MaybePromise<TransformerResult>>[]
> = {
	[Key in keyof Array_]: (
		Array_[Key] extends Transformer<infer ReturnType>
			? Awaited<ReturnType>
			: unknown
	);
};

type AddSourceMap<T> = Omit<T, 'map'> & { map: SourceMap };

export function applyTransformersSync<
	T extends Readonly<Transformer<TransformerResult>[]>,
>(
	filePath: string,
	code: string,
	transformers: T,
) {
	const maps: SourceMapInput[] = [];
	const result = { code };

	for (const transformer of transformers) {
		const transformed = transformer(filePath, result.code);

		if (transformed) {
			Object.assign(result, transformed);
			maps.unshift(transformed.map);
		}
	}

	return {
		...result,
		map: remapping(maps, () => null),
	} as unknown as AddSourceMap<IntersectionArray<Results<[...T]>>>;
}

export async function applyTransformers<
	T extends Readonly<Transformer<MaybePromise<TransformerResult>>[]>,
>(
	filePath: string,
	code: string,
	transformers: T,
) {
	const maps: SourceMapInput[] = [];
	const result = { code };

	for (const transformer of transformers) {
		const transformed = await transformer(filePath, result.code);

		if (transformed) {
			Object.assign(result, transformed);
			maps.unshift(transformed.map);
		}
	}

	return {
		...result,
		map: remapping(maps, () => null),
	 } as unknown as AddSourceMap<IntersectionArray<Results<[...T]>>>;
}
