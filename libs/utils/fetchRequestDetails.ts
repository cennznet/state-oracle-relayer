import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { Api } from "@cennznet/api";
import { BytesLike } from "ethers";

interface RequestDetails {
	requestInfo: Record<string, any>;
	requestInput: BytesLike;
}

export const fetchRequestDetails = async (
	requestId: number
): Promise<RequestDetails | void> => {
	const cennz = await getCENNZnetApi();
	const rawRequestInfo: any = await cennz.query.ethStateOracle.requests(
		requestId
	);
	if (rawRequestInfo.isNone) return;

	const requestInfo = rawRequestInfo.toJSON();
	const requestInput = (await cennz.query.ethStateOracle.requestInputData(
		requestId.toString()
	)) as unknown as BytesLike;

	return { requestInfo, requestInput };
};
