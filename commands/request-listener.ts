import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";

(async function run() {
	try {
		const [channel, queue] = await getRabbitMQSet();
		queue.publish("hello world");
		await channel.close();
		process.exit(0);
	} catch (error: any) {
		if (error instanceof AMQPError) error?.connection?.close();
		console.error(error);
	}
})();
