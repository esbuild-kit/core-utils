// Check if native source maps are supported by seeing if the programatic api is available.
// https://nodejs.org/dist/latest-v18.x/docs/api/process.html#processsetsourcemapsenabledval

// Also check if `Error.prepareStackTrace` has been set as that makes native source maps not work.
// https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#:~:text=Overriding%20Error.prepareStackTrace%20prevents%20%2D%2Denable%2Dsource%2Dmaps%20from%20modifying%20the%20stack%20trace.

export const hasNativeSourceMapSupport = !Error.prepareStackTrace && 'setSourceMapsEnabled' in process;
