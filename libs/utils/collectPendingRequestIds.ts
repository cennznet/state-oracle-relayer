import { Request } from "@/libs/models";

export const collectPendingRequestIds = async (
	nextRequestId: number
): Promise<number[]> => {
	const lastProcessedRequest = await Request.findOne()
		.sort({
			requestId: "desc",
		})
		.exec();

	const requestIdToStart = lastProcessedRequest
		? lastProcessedRequest.requestId + 1
		: 0;

	const requestIds = [];

	for (let i = requestIdToStart; i < nextRequestId; i++) requestIds.push(i);

	return requestIds;
};
