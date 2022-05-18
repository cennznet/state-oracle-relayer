import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";
import { BytesLike } from "ethers";
import { Request, RequestInterface } from "@/libs/models";

(async function run() {
	const logger = getLogger("RequestProccessor");

	try {
		logger.info(
			`
Initiating with CENNZnet: %s | Ethereum: %s
`,
			CENNZNET_NETWORK,
			ETHEREUM_NETWORK
		);
		const cennz = await getCENNZnetApi();
		const [channel, queue] = await getRabbitMQSet("RequestQueue");

		channel.prefetch(1);
		queue.subscribe({}, async (message) => {
			const body = message.bodyString();
			if (!body) return;
			const requestId = Number(body);
			const rawRequestInfo: any = await cennz.query.ethStateOracle.requests(
				requestId.toString()
			);
			if (rawRequestInfo.isNone) return;

			updateRequestRecord(requestId, { state: "Created" });

			const requestInfo = rawRequestInfo.unwrap();
			const requestInput = (await cennz.query.ethStateOracle.requestInputData(
				requestId.toString()
			)) as unknown as BytesLike;

			updateRequestRecord(requestId, { requestInfo, state: "Fetched" });
			logger.info(
				"Request %d, with info %s",
				requestId,
				requestInfo.toString()
			);
		});
	} catch (error) {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error(error);
	}
})();

async function updateRequestRecord(
	requestId: number,
	data: Partial<RequestInterface>
) {
	return Request.findOneAndUpdate(
		{ requestId },
		{ ...data, requestId, updatedAt: new Date() },
		{ upsert: true }
	);
}
