import { MONGODB_SERVER } from "@/libs/constants";
import mongooes, { Schema, Model } from "mongoose";

mongooes.connect(MONGODB_SERVER);

export interface RequestInterface {
	requestId: number;
	requestInfo?: Record<string, any>;
	state: "Created" | "EthCalled" | "CENNZCalled";
	status: "Pending" | "Successful" | "Failed";
	ethBlockNumber: string;
	cennzTxHash: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const RequestSchema = new Schema<RequestInterface>({
	requestId: { type: Schema.Types.Number, required: true, unique: true },
	requestInfo: { type: Schema.Types.Map, of: Schema.Types.Mixed },
	state: { type: Schema.Types.String, required: true },
	ethBlockNumber: { type: Schema.Types.Number },
	cennzTxHash: { type: Schema.Types.String },
	createdAt: { type: Schema.Types.Date, default: Date.now },
	updatedAt: { type: Schema.Types.Date, default: Date.now },
});

export const Request: Model<RequestInterface> = mongooes.model(
	"Request",
	RequestSchema
);
