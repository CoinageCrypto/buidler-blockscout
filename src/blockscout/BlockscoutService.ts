import { BuidlerPluginError } from '@nomiclabs/buidler/plugins';
import request from 'request-promise';

import BlockscoutResponse from './BlockscoutResponse';
import BlockscoutVerifyContractRequest from './BlockscoutVerifyContractRequest';

export default class BlockscoutService {
	constructor(private readonly url: string) {}

	public async verifyContract(req: BlockscoutVerifyContractRequest): Promise<BlockscoutResponse> {
		try {
			const response = new BlockscoutResponse(
				await request.post(this.url, { form: req, json: true })
			);

			if (!response.isOk()) {
				throw new BuidlerPluginError(response.message);
			}
			return response;
		} catch (e) {
			throw new BuidlerPluginError(
				'Failed to send contract verification request. Reason: ' + e.message,
				e
			);
		}
	}

	public async getVerificationStatus(guid: string): Promise<BlockscoutResponse> {
		try {
			const response = new BlockscoutResponse(
				await request.get(this.url, {
					json: true,
					qs: {
						module: 'contract',
						action: 'checkverifystatus',
						guid,
					},
				})
			);
			if (response.isPending()) {
				await this.delay(2000);
				return this.getVerificationStatus(guid);
			}
			if (!response.isOk()) {
				throw new BuidlerPluginError(response.message);
			}
			return response;
		} catch (e) {
			throw new BuidlerPluginError('Failed to verify contract. Reason: ' + e.message);
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}
}
