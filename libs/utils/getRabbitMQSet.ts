import { AMQPChannel, AMQPClient, AMQPQueue } from "@cloudamqp/amqp-client";
import { RABBBITMQ_SERVER } from "@/libs/constants";

type QueueName = "RequestQueue";
export const getRabbitMQSet = async (
	name: QueueName
): Promise<[AMQPChannel, AMQPQueue]> => {
	const client = new AMQPClient(RABBBITMQ_SERVER);
	const connection = await client.connect();

	const channel = await connection.channel();
	const queue = await channel.queue(`OracleRelayer_${name}`, { durable: true });

	return [channel, queue];
};
