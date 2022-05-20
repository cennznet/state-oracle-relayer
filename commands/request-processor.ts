import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError, AMQPMessage } from "@cloudamqp/amqp-client";
import { Request, RequestInterface } from "@/libs/models";
import { callEthereum } from "@/libs/utils/callEthereum";
import { fetchRequestDetails } from "@/libs/utils/fetchRequestDetails";
import { callCENNZ } from "@/libs/utils/callCENNZ";

const logger = getLogger("RequestProccessor");

(async function run() {
	try {
		logger.info(
			`
Start RequestProccessor with CENNZnet: %s | Ethereum: %s
`,
			CENNZNET_NETWORK,
			ETHEREUM_NETWORK
		);

		const [channel, queue] = await getRabbitMQSet("RequestQueue");
		channel.prefetch(1);
		queue.subscribe({}, onMessage);
	} catch (error) {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error(error);
	}
})();

async function onMessage(message: AMQPMessage) {
	let updateRequestRecord: any = null;
	try {
		const body = message.bodyString();
		if (!body) return;
		const requestId = Number(body);
		updateRequestRecord = createRequestRecordUpdater(requestId) as ReturnType<
			typeof createRequestRecordUpdater
		>;

		await updateRequestRecord({
			status: "Pending",
			state: "Created",
		});

		// 1. Fetch request details from CENNZnet
		logger.info("Request #%d: fetching details...", requestId);
		const { requestInfo, requestInput } =
			(await fetchRequestDetails(requestId)) || {};
		if (!requestInfo || !requestInput) {
			await updateRequestRecord({
				status: "Skipped",
			});
			logger.info("Request #%d: skipped.", requestId);
			return;
		}

		await updateRequestRecord({
			requestInfo,
			state: "InfoFetched",
		});

		// 2. Call Ethereum with the request details above
		logger.info("Request #%d: calling Ethereum...", requestId);
		const { returnData, blockNumber } = await callEthereum(
			requestInfo.destination,
			requestInput
		);

		await updateRequestRecord({
			state: "EthCalled",
			ethBlockNumber: blockNumber.toString(),
		});

		// 3. Submit the `returnData` back to requester
		logger.info("Request #%d: calling CENNZnet...", requestId);
		const result = await callCENNZ(requestId, returnData, blockNumber);

		await updateRequestRecord({
			state: "CENNZCalled",
			status: "Successful",
			cennzTxHash: result.txHash,
		});

		logger.info("Request #%d: done.", requestId, result.txHash);
	} catch (error: any) {
		if (error?.code === "CENNZ_DISPATCH_ERROR")
			await updateRequestRecord?.({ state: "CENNZCalled", status: "Failed" });
		else await updateRequestRecord?.({ status: "Failed" });
		throw error;
	}
}

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
