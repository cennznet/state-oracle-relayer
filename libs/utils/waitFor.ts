export const waitFor = (
	timeout: number = 10000,
	returnData: any
): Promise<any> => {
	return new Promise((resolve) => {
		setTimeout(resolve.bind(null, returnData), timeout);
	});
};
