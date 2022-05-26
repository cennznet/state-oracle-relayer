import {
	ALCHEMY_API_TOKEN,
	ETHEREUM_NETWORK,
	INFURA_PROJECT,
} from "@/libs/constants";
import { ethers } from "ethers";

export const getEthersProvider = (): ethers.providers.BaseProvider => {
	return ethers.getDefaultProvider(ETHEREUM_NETWORK, {
		...(INFURA_PROJECT && { infura: INFURA_PROJECT }),
		...(ALCHEMY_API_TOKEN && { alchemy: ALCHEMY_API_TOKEN }),
	});
};
