import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";

(async function run() {
	try {
		const [channel, queue] = await getRabbitMQSet();
		channel.prefetch(1);
		queue.subscribe({}, (message) => {
			console.log(message.bodyString());
		});
	} catch (error) {
		console.error(error);
	}
})();
