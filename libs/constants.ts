export const MONGODB_SERVER: string =
	process.env.MONGODB_SERVER ?? "mongodb://root:root@localhost:27017/admin";
export const RABBBITMQ_SERVER: string =
	process.env.RABBBITMQ_SERVER ?? "amqp://guest:guest@localhost:5672";
export const CENNZNET_NETWORK: string = process.env.CENNZNET_NETWORK ?? "local";
export const ETHEREUM_NETWORK: string = process.env.ETHEREUM_NETWORK ?? "kovan";
export const CENNZNET_SIGNER: string = process.env.CENNZNET_SIGNER ?? "";
export const MESSAGE_MAX_RETRY: number = Number(
	process.env.MESSAGE_MAX_RETRY ?? 3
);
