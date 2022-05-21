import { CENNZNET_NETWORK, ETHEREUM_NETWORK } from "@/libs/constants";
import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError, AMQPMessage } from "@cloudamqp/amqp-client";
import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getEthersProvider } from "@/libs/utils/getEthersProvider";
import { handleRequestMessage } from "@/libs/utils/handleRequestMessage";

const logger = getLogger("RequestProccessor");
logger.info(
	`Start RequestProccessor with CENNZnet: %s | Ethereum: %s...`,
	CENNZNET_NETWORK,
	ETHEREUM_NETWORK
);
Promise.all([getCENNZnetApi(), getEthersProvider()])
	.then(async ([cennzApi, ethersProvider]) => {
		const [channel, queue] = await getRabbitMQSet("RequestQueue");
		const onMessage = (message: AMQPMessage) => {
			handleRequestMessage(cennzApi, ethersProvider, queue, message);
		};

		channel.prefetch(1);
		queue.subscribe({ noAck: false }, onMessage);
	})
	.catch((error) => {
		if (error instanceof AMQPError) error?.connection?.close();
		logger.error(error);
	});
