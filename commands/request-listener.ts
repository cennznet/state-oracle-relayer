import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { collectPendingRequestIds } from "@/libs/utils/collectPendingRequestIds";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";
import chalk from "chalk";

const logger = getLogger("RequestListener");
logger.info(
	`Start RequestListener with CENNZnet: ${chalk.magenta(
		"%s"
	)} | Ethereum: ${chalk.magenta("%s")}...`,
	CENNZNET_NETWORK,
	ETHEREUM_NETWORK
);
Promise.all([getCENNZnetApi()])
	.then(async ([cennzApi]) => {
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
	})
	.catch((error) => {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error("%s", error);
	});
