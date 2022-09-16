import { describe } from 'manten';

// Disable native source maps
// @ts-expect-error missing process type
delete process.setSourceMapsEnabled;

describe('core-utils', ({ runTestSuite }) => {
	runTestSuite(import('./specs/transform.js'));
	runTestSuite(import('./specs/source-maps.js'));
});
