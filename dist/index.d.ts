import { TransformOptions, TransformResult } from 'esbuild';

declare function installSourceMapSupport(): Map<string, string> | undefined;

declare function transformSync(code: string, filePath: string, extendOptions?: TransformOptions): TransformResult;
declare function transform(code: string, filePath: string, extendOptions?: TransformOptions): Promise<TransformResult>;

declare function transformDynamicImport({ code, map }: {
    code: string;
    map?: string;
}, sourcemap?: boolean | 'inline'): {
    code: string;
    map: string;
} | undefined;

declare function resolveTsPath(filePath: string): string | undefined;

export { installSourceMapSupport, resolveTsPath, transform, transformDynamicImport, transformSync };
