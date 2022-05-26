import { Request, RequestInterface } from "@/libs/models";
import { callCENNZ } from "@/libs/utils/callCENNZ";
import { callEthereum } from "@/libs/utils/callEthereum";
import { fetchRequestDetails } from "@/libs/utils/fetchRequestDetails";
import { getLogger } from "@/libs/utils/getLogger";
import { requeueMessage } from "@/libs/utils/requeueMessage";
import { Api } from "@cennznet/api";
import { AMQPMessage, AMQPQueue } from "@cloudamqp/amqp-client";
import { ethers } from "ethers";

const logger = getLogger("RequestProccessor");

export const handleRequestMessage = async (
	cennzApi: Api,
	ethersProvider: ethers.providers.BaseProvider,
	queue: AMQPQueue,
	message: AMQPMessage
): Promise<void> => {
	let updateRequestRecord: any = null;
	const body = message.bodyString();
	if (!body) return;
	const requestId = Number(body);
	updateRequestRecord = createRequestRecordUpdater(requestId) as ReturnType<
		typeof createRequestRecordUpdater
	>;

	try {
		await updateRequestRecord({
			status: "Pending",
			state: "Created",
		});

		// 1. Fetch request details from CENNZnet
		logger.info("Request #%d: fetching details...", requestId);
		const requestDetails = await fetchRequestDetails(cennzApi, requestId);
		if (!requestDetails) {
			await updateRequestRecord({
				status: "Skipped",
			});
			await message.ack();
			logger.info("Request #%d: skipped.", requestId);
			return;
		}

		await updateRequestRecord({
			requestDetails,
			state: "InfoFetched",
		});

		// 2. Call Ethereum with the request details above
		logger.info("Request #%d: calling Ethereum...", requestId);
		const { returnData, blockNumber, blockTimestamp } = await callEthereum(
			ethersProvider,
			requestDetails.destination,
			requestDetails.inputData
		);

		await updateRequestRecord({
			state: "EthCalled",
			ethBlockNumber: blockNumber.toString(),
		});

		// 3. Submit the `returnData` back to requester
		logger.info("Request #%d: calling CENNZnet...", requestId);
		const result = await callCENNZ(
			cennzApi,
			requestId,
			returnData,
			blockNumber,
			blockTimestamp
		);

		await updateRequestRecord({
			state: "CENNZCalled",
			status: "Successful",
			cennzTxHash: result.txHash,
		});

		await message.ack();
		logger.info("Request #%d: done.", requestId);
	} catch (error: any) {
		if (error?.code === "CENNZ_DISPATCH_ERROR")
			await updateRequestRecord?.({
				state: "CENNZCalled",
				status: "Failed",
			});
		else await updateRequestRecord?.({ status: "Failed" });
		const response = await requeueMessage(queue, message);
		logger.info("Request #%d: %s.", requestId, response.toLowerCase());
		logger.error(error);
	}
};

function createRequestRecordUpdater(
	requestId: number
): (data: Partial<RequestInterface>) => Promise<any> {
	return async (data: Partial<RequestInterface>) =>
		Request.findOneAndUpdate(
			{ requestId },
			{ ...data, requestId, updatedAt: new Date() },
			{ upsert: true }
		);
}
