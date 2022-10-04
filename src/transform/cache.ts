import fs from 'fs';
import path from 'path';
import os from 'os';
import { readJsonFile } from '../utils/read-json-file';
import type { FinalTransform } from './apply-transformers';

const getTime = () => Math.floor(Date.now() / 1e8);

class FileCache<ReturnType> extends Map<string, ReturnType> {
	/**
	 * By using tmpdir, the expectation is for the OS to clean any files
	 * that haven't been read for a while.
	 *
	 * macOS - 3 days: https://superuser.com/a/187105
	 * Linux - https://serverfault.com/a/377349
	 *
	 * Note on Windows, temp files are not cleaned up automatically.
	 * https://superuser.com/a/1599897
	 */
	cacheDirectory = path.join(os.tmpdir(), 'esbuild-kit');

	cacheFiles: {
		time: number;
		key: string;
		fileName: string;
	}[];

	constructor() {
		super();

		// Handles race condition if multiple tsx instances are running (#22)
		fs.mkdirSync(this.cacheDirectory, { recursive: true });

		this.cacheFiles = fs.readdirSync(this.cacheDirectory).map((fileName) => {
			const [time, key] = fileName.split('-');
			return {
				time: Number(time),
				key,
				fileName,
			};
		});

		setImmediate(() => this.expireDiskCache());
	}

	get(key: string) {
		const memoryCacheHit = super.get(key);

		if (memoryCacheHit) {
			return memoryCacheHit;
		}

		const diskCacheHit = this.cacheFiles.find(cache => cache.key === key);
		if (!diskCacheHit) {
			return;
		}

		const cacheFilePath = path.join(this.cacheDirectory, diskCacheHit.fileName);
		const cachedResult = readJsonFile<ReturnType>(cacheFilePath);

		if (!cachedResult) {
			// Remove broken cache file
			fs.promises.unlink(cacheFilePath).then(
				() => {
					const index = this.cacheFiles.indexOf(diskCacheHit);
					this.cacheFiles.splice(index, 1);
				},
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				() => {},
			);
			return;
		}

		// Load it into memory
		super.set(key, cachedResult);

		return cachedResult;
	}

	set(key: string, value: ReturnType) {
		super.set(key, value);

		if (value) {
			/**
			 * Time is inaccurate by ~27.7 hours to minimize data
			 * and because this level of fidelity wont matter
			 */
			const time = getTime();

			fs.promises.writeFile(
				path.join(this.cacheDirectory, `${time}-${key}`),
				JSON.stringify(value),
			).catch(
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				() => {},
			);
		}

		return this;
	}

	expireDiskCache() {
		const time = getTime();

		for (const cache of this.cacheFiles) {
			// Remove if older than ~7 days
			if ((time - cache.time) > 7) {
				fs.promises.unlink(path.join(this.cacheDirectory, cache.fileName)).catch(
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					() => {},
				);
			}
		}
	}
}

export default (
	process.env.ESBK_DISABLE_CACHE
		? new Map<string, FinalTransform>()
		: new FileCache<FinalTransform>()
);
