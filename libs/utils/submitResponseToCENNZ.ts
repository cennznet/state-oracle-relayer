import { CENNZNET_SIGNER } from "@/libs/constants";
import { Api, SubmittableResult } from "@cennznet/api";
import Keyring from "@polkadot/keyring";
import { BigNumberish, BytesLike, utils } from "ethers";

export const submitResponseToCENNZ = async (
	api: Api,
	requestId: number,
	returnData: BytesLike,
	blockNumber: BigNumberish,
	blockTimestamp: number
): Promise<SubmittableResult> => {
	const returnDataLength = utils.hexDataLength(returnData);

	if (returnDataLength < 32) throw { code: "INVALID_RETURN_DATA" };

	const signer = new Keyring({ type: "sr25519" }).addFromSeed(
		CENNZNET_SIGNER as any
	);

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