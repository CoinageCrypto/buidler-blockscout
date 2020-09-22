require('../../src/index');

module.exports = {
	blockscout: {
		url: 'https://blockscout.com/poa/core/api',
		apiKey: process.env.BLOCKSCOUT_API_KEY || 'testtoken',
	},
	solc: {
		version: '0.5.1',
	},
};
