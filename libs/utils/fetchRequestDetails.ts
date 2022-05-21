import { Api } from "@cennznet/api";
import { BytesLike } from "ethers";

interface RequestDetails {
	requestInfo: Record<string, any>;
	requestInput: BytesLike;
}

export const fetchRequestDetails = async (
	api: Api,
	requestId: number
): Promise<RequestDetails | void> => {
	const rawRequestInfo: any = await api.query.ethStateOracle.requests(
		requestId
	);

	if (rawRequestInfo.isNone) return;

	const requestInfo = rawRequestInfo.toJSON();
	const requestInput = (await api.query.ethStateOracle.requestInputData(
		requestId.toString()
	)) as unknown as BytesLike;

	return { requestInfo, requestInput };
};
