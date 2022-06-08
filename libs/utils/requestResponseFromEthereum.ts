import { BigNumberish, BytesLike, ethers } from "ethers";

interface EthCallResponse {
	// eth abi encoded (raw) return data from the 'eth_call' rpc
	returnData: BytesLike;
	// The block number where returnData was retrieved
	blockNumber: BigNumberish;

	blockTimestamp: number;
}

export const requestResponseFromEthereum = async (
	provider: ethers.providers.BaseProvider,
	target: string,
	input: BytesLike
): Promise<EthCallResponse> => {
	const blockNumber = await provider.getBlockNumber();
	const { timestamp: blockTimestamp } = await provider.getBlock(blockNumber);
	const returnData = await provider.call(
		{
			to: target,
			data: input,
		},
		blockNumber
	);

	return { returnData, blockNumber, blockTimestamp };
};
