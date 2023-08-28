import { describe } from 'manten';

console.log('Node.js version', process.version);
describe('core-utils', ({ runTestSuite }) => {
	runTestSuite(import('./specs/transform.js'));
	runTestSuite(import('./specs/source-maps.js'));
});
