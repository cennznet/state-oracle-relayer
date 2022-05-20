import { CENNZNET_SIGNER } from "@/libs/constants";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { SubmittableResult } from "@cennznet/api";
import Keyring from "@polkadot/keyring";
import { BigNumberish, BytesLike } from "ethers";

export const callCENNZ = async (
	requestId: number,
	returnData: BytesLike,
	blockNumber: BigNumberish
): Promise<SubmittableResult> => {
	const signer = new Keyring({ type: "sr25519" }).addFromSeed(
		CENNZNET_SIGNER as any
	);

	const cennz = await getCENNZnetApi();

	return new Promise((resolve, reject) => {
		cennz.tx.ethStateOracle
			.submitCallResponse(requestId, returnData, blockNumber)
			.signAndSend(signer, (result: SubmittableResult) => {
				const { status, dispatchError } = result;

				if (!status.isInBlock) return;

				if (dispatchError)
					return reject({ code: "CENNZ_DISPATCH_ERROR", error: dispatchError });

				resolve(result);
			});
	});
};
