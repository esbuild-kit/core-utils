import { describe } from 'manten';

describe('core-utils', ({ runTestSuite }) => {
	runTestSuite(import('./specs/transform.js'));
	runTestSuite(import('./specs/source-maps.js'));
});
