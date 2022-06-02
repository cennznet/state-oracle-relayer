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
	message: AMQPMessage,
	abortSignal: AbortSignal
): Promise<void> => {
	let updateRequestRecord: any = null;
	const body = message.bodyString();
	if (!body) return;
	const requestId = Number(body);
	let messageDelivered = false;
	updateRequestRecord = createRequestRecordUpdater(requestId) as ReturnType<
		typeof createRequestRecordUpdater
	>;

	try {
		abortSignal.addEventListener(
			"abort",
			async () => {
				if (messageDelivered) return;
				await updateRequestRecord?.({ status: "Aborted" });
				await message.reject(false);
				logger.info("Request #%d: aborted.", requestId);
			},
			{ once: true }
		);

		await updateRequestRecord({
			status: "Pending",
			state: "Created",
		});

		// 1. Fetch request details from CENNZnet
		if (abortSignal.aborted) return;
		logger.info("Request #%d: [1/3] fetching details...", requestId);
		const requestDetails = await fetchRequestDetails(cennzApi, requestId);
		if (!requestDetails) {
			await updateRequestRecord({
				status: "Skipped",
			});
			messageDelivered = true;
			await message.ack();
			logger.info("Request #%d: skipped.", requestId);
			return;
		}

		await updateRequestRecord({
			requestDetails,
			state: "InfoFetched",
		});

		// 2. Call Ethereum with the request details above
		if (abortSignal.aborted) return;
		logger.info("Request #%d: [2/3] calling Ethereum...", requestId);
		const { returnData, blockNumber, blockTimestamp } = await callEthereum(
			ethersProvider,
			requestDetails.destination,
			requestDetails.inputData
		);

		await updateRequestRecord({
			state: "EthCalled",
			ethBlockNumber: blockNumber.toString(),
		});

		if (abortSignal.aborted) return;

		// 3. Submit the `returnData` back to requester
		logger.info("Request #%d: [3/3] calling CENNZnet...", requestId);
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

		if (abortSignal.aborted) return;
		messageDelivered = true;
		await message.ack();
		logger.info("Request #%d: done 🎉", requestId);
	} catch (error: any) {
		switch (error?.code) {
			case "CENNZ_DISPATCH_ERROR":
				await updateRequestRecord?.({
					state: "CENNZCalled",
					status: "Failed",
				});
				break;
			default:
				await updateRequestRecord?.({ status: "Failed" });
				break;
		}
		messageDelivered = true;
		const response = await requeueMessage(queue, message);
		logger.info("Request #%d: %s.", requestId, response.toLowerCase());
		logger.error("Request #%d: %s", requestId, error);
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
