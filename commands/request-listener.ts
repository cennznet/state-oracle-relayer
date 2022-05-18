import { getLogger } from "@/libs/utils/getLogger";
import { getRabbitMQSet } from "@/libs/utils/getRabbitMQSet";
import { AMQPError } from "@cloudamqp/amqp-client";

const logger = getLogger("RequestListener");

(async function run() {
	try {
		logger.info(`
State 🔮 Relayer
	Signer: ABC
	CENNZnet: Rata
	Ethereum: Ropsten
		`);

		process.exit(0);
	} catch (error: any) {
		if (error instanceof AMQPError) error?.connection?.close();
		console.error(error);
	}
})();
