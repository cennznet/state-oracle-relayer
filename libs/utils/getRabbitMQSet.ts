import { AMQPChannel, AMQPClient, AMQPQueue } from "@cloudamqp/amqp-client";
import { RABBBITMQ_SERVER } from "@/libs/constants";

export const getRabbitMQSet = async (): Promise<[AMQPChannel, AMQPQueue]> => {
	const client = new AMQPClient(RABBBITMQ_SERVER);
	const connection = await client.connect();

	const channel = await connection.channel();
	const queue = await channel.queue("oracle-relayer", { durable: true });

	return [channel, queue];
};
