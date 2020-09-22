import { TASK_FLATTEN_GET_FLATTENED_SOURCE } from '@nomiclabs/buidler/builtin-tasks/task-names';
import { extendEnvironment, task } from '@nomiclabs/buidler/config';
import { BuidlerPluginError, lazyObject } from '@nomiclabs/buidler/plugins';

import AbiEncoder from './AbiEncoder';
import ContractCompiler from './ContractCompiler';
import BlockscoutService from './blockscout/BlockscoutService';
import BlockscoutVerifyContractRequest from './blockscout/BlockscoutVerifyContractRequest';
import SolcVersions from './solc/SolcVersions';

export class BlockscoutBuidlerEnvironment {
	constructor(
		public readonly url: string = 'https://blockscout.com/poa/core/api',
		public readonly apiKey: string = ''
	) {}
}

declare module '@nomiclabs/buidler/types' {
	export interface BuidlerRuntimeEnvironment {
		blockscout: BlockscoutBuidlerEnvironment;
	}

	export interface BuidlerConfig {
		blockscout?: {
			url?: string;
			apiKey?: string;
		};
	}

	export interface SolcConfig {
		fullVersion: string;
	}
}

extendEnvironment((env) => {
	env.blockscout = lazyObject(() => {
		if (env.config.blockscout) {
			return new BlockscoutBuidlerEnvironment(
				env.config.blockscout.url,
				env.config.blockscout.apiKey
			);
		}
		return new BlockscoutBuidlerEnvironment();
	});
});

task('verify-contract', 'Verifies contract on blockscout')
	.addParam('contractName', 'Name of the deployed contract')
	.addParam('address', 'Deployed address of smart contract')
	.addOptionalParam(
		'libraries',
		'Stringified JSON object in format of {library1: "0x2956356cd2a2bf3202f771f50d3d14a367b48071"}'
	)
	.addOptionalParam('source', 'Contract source')
	.addOptionalVariadicPositionalParam('constructorArguments', 'arguments for contract constructor')
	.setAction(
		async (
			taskArgs: {
				contractName: string;
				address: string;
				libraries: string;
				source: string;
				constructorArguments: string[];
			},
			{ blockscout, config, run }
		) => {
			if (!blockscout.apiKey || !blockscout.apiKey.trim()) {
				throw new BuidlerPluginError(
					'Please provide blockscout api token via buidler.config.js (blockscout.apiKey)'
				);
			}
			let source = '';
			if (taskArgs.source) {
				source = taskArgs.source;
			} else {
				source = await run(TASK_FLATTEN_GET_FLATTENED_SOURCE);
			}
			const abi = await new ContractCompiler(run).getAbi(source, taskArgs.contractName);
			config.solc.fullVersion = await SolcVersions.toLong(config.solc.version);
			const request = new BlockscoutVerifyContractRequest(
				blockscout,
				config.solc,
				taskArgs.contractName,
				taskArgs.address,
				taskArgs.libraries,
				source,
				AbiEncoder.encodeConstructor(abi, taskArgs.constructorArguments)
			);
			const blockscoutService = new BlockscoutService(blockscout.url);
			const response = await blockscoutService.verifyContract(request);
			console.log(
				'Successfully submitted contract for verification on blockscout. Waiting for verification result...'
			);
			await blockscoutService.getVerificationStatus(response.message);
			console.log('Successfully verified contract on blockscout');
		}
	);
