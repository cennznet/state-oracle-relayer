import {
	CENNZNET_NETWORK,
	ETHEREUM_NETWORK,
	MESSAGE_MAX_TIME,
} from "@/libs/constants";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError, AMQPMessage } from "@cloudamqp/amqp-client";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getEthersProvider } from "@/libs/utils/getEthersProvider";
import { handleRequestMessage } from "@/libs/utils/handleRequestMessage";
import { waitFor } from "@/libs/utils/waitFor";

const logger = getLogger("RequestProccessor");
logger.info(
	`Start RequestProccessor with CENNZnet: %s | Ethereum: %s...`,
	CENNZNET_NETWORK,
	ETHEREUM_NETWORK
);
Promise.all([getCENNZnetApi(), getEthersProvider()])
	.then(async ([cennzApi, ethersProvider]) => {
		const [channel, queue] = await getRabbitMQSet("RequestQueue");
		const onMessage = async (message: AMQPMessage) => {
			const response = await Promise.race([
				handleRequestMessage(cennzApi, ethersProvider, queue, message),
				waitFor(MESSAGE_MAX_TIME, "timeout"),
			]);

			if (response === "timeout") {
				await message.reject(false);
				logger.error("timeout");
			}
		};

		channel.prefetch(1);
		queue.subscribe({ noAck: false }, onMessage);
	})
	.catch((error) => {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error("%s", error);
	});
