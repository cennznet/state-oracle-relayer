import { CENNZNET_NETWORK } from "@/libs/constants";
import { Api } from "@cennznet/api";
import { CENNZNetNetwork } from "@cennznet/api/types";

export const getCENNZnetApi = async (): Promise<Api> => {
	return await Api.create({
		network: CENNZNET_NETWORK as CENNZNetNetwork,
	});
};
