import { Api, SubmittableResult } from "@cennznet/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { BigNumberish, BytesLike, utils } from "ethers";

export const submitResponseToCENNZ = async (
	api: Api,
	requestId: number,
	returnData: BytesLike,
	blockNumber: BigNumberish,
	blockTimestamp: number,
	signer: KeyringPair
): Promise<SubmittableResult> => {
	const returnDataLength = utils.hexDataLength(returnData);

	if (returnDataLength < 32) throw { code: "INVALID_RETURN_DATA" };

	const returnDataClaim = api.registry.createType(
		"ReturnDataClaim",
		returnDataLength === 32
			? {
					Ok: returnData,
			  }
			: { ExceedsLengthLimit: null }
	);

	return new Promise((resolve, reject) => {
		api.tx.ethStateOracle
			.submitCallResponse(
				requestId,
				returnDataClaim,
				blockNumber,
				blockTimestamp
			)
			.signAndSend(signer, (result: SubmittableResult) => {
				const { status, dispatchError } = result;

				if (!status.isInBlock) return;

				if (dispatchError)
					return reject({
						code: "CENNZ_DISPATCH_ERROR",
						error: JSON.stringify(dispatchError.toJSON()),
					});

				resolve(result);
			});
	});
};
