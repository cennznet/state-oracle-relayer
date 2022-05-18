import { MONGODB_SERVER } from "@/libs/constants";
import mongooes, { Schema, Model } from "mongoose";

mongooes.connect(MONGODB_SERVER);

export interface RequestInterface {
	requestId: number;
	state: "Created" | "Fetched" | "EthCalled" | "Successful" | "Failed";
	requestInfo?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const RequestSchema = new Schema<RequestInterface>({
	requestId: { type: Schema.Types.Number, required: true, unique: true },
	requestInfo: { type: Schema.Types.String },
	state: { type: Schema.Types.String, required: true },
	createdAt: { type: Schema.Types.Date, default: Date.now },
	updatedAt: { type: Schema.Types.Date, default: Date.now },
});

export const Request: Model<RequestInterface> = mongooes.model(
	"Request",
	RequestSchema
);
