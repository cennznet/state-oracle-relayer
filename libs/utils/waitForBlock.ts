import { Api } from "@cennznet/api";

export const waitForBlock = async (
	api: Api,
	numberOfBlock: number = 1
): Promise<void> => {
	let firstBlock: number;

	return new Promise(async (resolve) => {
		const unsubscribe = await api.derive.chain.subscribeNewHeads(
			async (header) => {
				const headerBlock = header.number.toNumber();

				if (!firstBlock) firstBlock = header.number.toNumber();

				if (headerBlock < firstBlock + numberOfBlock) return;

				unsubscribe();
				resolve();
			}
		);
	});
};
