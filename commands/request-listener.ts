import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { collectPendingRequestIds } from "@/libs/utils/collectPendingRequestIds";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";

const logger = getLogger("RequestListener");
logger.info(
	`Start RequestListener with CENNZnet: %s | Ethereum: %s...`,
	CENNZNET_NETWORK,
	ETHEREUM_NETWORK
);
Promise.all([getCENNZnetApi()]).then(async ([cennzApi]) => {
	try {
		const [, queue] = await getRabbitMQSet("RequestQueue");

		await cennzApi.query.ethStateOracle.nextRequestId(
			async (nextRequestId: any) => {
				const requestIds = await collectPendingRequestIds(
					nextRequestId.toNumber()
				);

				requestIds.forEach((requestId) => {
					queue.publish(requestId.toString());
				});
			}
		);
	} catch (error: any) {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error(error);
	}
});
