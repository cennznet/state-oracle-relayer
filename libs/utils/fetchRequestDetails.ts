import { Api } from "@cennznet/api";

interface RequestDetails {
	destination: string;
	caller: string;
	inputData: string;
	[key: string]: any;
}

export const fetchRequestDetails = async (
	api: Api,
	requestId: number
): Promise<RequestDetails | void> => {
	const rawRequestDetails: any = await api.query.ethStateOracle.requests(
		requestId
	);

	if (rawRequestDetails.isNone) return;

	return rawRequestDetails.toJSON() as RequestDetails;
};
