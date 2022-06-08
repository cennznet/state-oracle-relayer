import { AMQPChannel, AMQPClient, AMQPQueue } from "@cloudamqp/amqp-client";
import { CENNZNET_NETWORK, RABBBITMQ_SERVER } from "@/libs/constants";

type QueueName = "RequestQueue";
export const getRabbitMQSet = async (
	name: QueueName
): Promise<[AMQPChannel, AMQPQueue]> => {
	const client = new AMQPClient(RABBBITMQ_SERVER);
	const connection = await client.connect();

	const channel = await connection.channel();
	const queue = await channel.queue(
		`${getNetworkName()}_OracleRelayer_${name}`,
		{ durable: true }
	);

	return [channel, queue];
};

function getNetworkName(): string {
	return `${CENNZNET_NETWORK.charAt(0).toUpperCase()}${CENNZNET_NETWORK.slice(
		1
	)}`;
}
