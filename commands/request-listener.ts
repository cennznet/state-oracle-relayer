import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { fetchRequestIds } from "@/libs/utils/fetchRequestIds";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";

(async function run() {
	const logger = getLogger("RequestListener");

	try {
		logger.info(
			`
Initiating with CENNZnet: %s | Ethereum: %s
`,
			CENNZNET_NETWORK,
			ETHEREUM_NETWORK
		);
		const cennz = await getCENNZnetApi();
		const [, queue] = await getRabbitMQSet("RequestQueue");

		cennz.query.ethStateOracle.nextRequestId(async (nextRequestId: any) => {
			const requestIds = await fetchRequestIds(nextRequestId.toNumber());

			requestIds.forEach((requestId) => {
				queue.publish(requestId.toString());
			});
		});
	} catch (error: any) {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error(error);
	}
})();
