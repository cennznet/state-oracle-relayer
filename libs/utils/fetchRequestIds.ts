export const fetchRequestIds = async (
	nextRequestId: number
): Promise<number[]> => {
	const lastProcessedRequestId = 0;
	const requestIds = [];

	for (let i = lastProcessedRequestId; i < nextRequestId; i++)
		requestIds.push(i);

	return requestIds;
};
