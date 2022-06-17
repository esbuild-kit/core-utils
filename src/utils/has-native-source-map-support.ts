export const hasNativeSourceMapSupport = (
	/**
	 * Check if native source maps are supported by seeing if the api is available
	 * https://nodejs.org/dist/latest-v18.x/docs/api/process.html#processsetsourcemapsenabledval
	 */
	'setSourceMapsEnabled' in process

	/**
	 * Overriding Error.prepareStackTrace prevents --enable-source-maps from modifying the stack trace
	 * https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#:~:text=Overriding%20Error.prepareStackTrace%20prevents%20%2D%2Denable%2Dsource%2Dmaps%20from%20modifying%20the%20stack%20trace.
	 */
	&& !('prepareStackTrace' in Error)
);
