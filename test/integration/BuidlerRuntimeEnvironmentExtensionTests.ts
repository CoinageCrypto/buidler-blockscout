import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { assert } from 'chai';

declare module 'mocha' {
	interface Context {
		env: BuidlerRuntimeEnvironment;
	}
}

describe('BuidlerRuntimeEnvironment extension', function () {
	before('Buidler project setup', function () {
		process.chdir(__dirname + '/../buidler-project');
		process.env.BUIDLER_NETWORK = 'develop';
		this.env = require('@nomiclabs/buidler');
	});

	it('It should add the blockscout field', function () {
		const { BlockscoutBuidlerEnvironment } = require('../../src');
		assert.instanceOf((this.env as any).blockscout, BlockscoutBuidlerEnvironment);
	});

	it('The blockscout url should have value from buidler.config.js', function () {
		assert.equal((this.env as any).blockscout.url, 'https://blockscout.com/poa/core/api');
	});

	it('The blockscout token should have value from buidler.config.js', function () {
		assert.equal(
			(this.env as any).blockscout.apiKey,
			process.env.BLOCKSCOUT_API_KEY || 'testtoken'
		);
	});
});
