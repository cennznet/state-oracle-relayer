import { CENNZNET_NETWORK } from "@/libs/constants";
import { Api } from "@cennznet/api";
import { CENNZNetNetwork } from "@cennznet/api/types";

let api: Api;

export const getCENNZnetApi = async (): Promise<Api> => {
	if (api) return api;
	return (api = await Api.create({
		network: CENNZNET_NETWORK as CENNZNetNetwork,
	}));
};
