import {
	ALCHEMY_API_TOKEN,
	ETHEREUM_NETWORK,
	ETHERSCAN_API_TOKEN,
	INFURA_PROJECT,
} from "@/libs/constants";
import { ethers } from "ethers";

export const getEthersProvider = (): ethers.providers.BaseProvider => {
	return ethers.getDefaultProvider(ETHEREUM_NETWORK, {
		...(INFURA_PROJECT && { infura: INFURA_PROJECT }),
		...(ALCHEMY_API_TOKEN && { alchemy: ALCHEMY_API_TOKEN }),
		...(ETHERSCAN_API_TOKEN && { etherscan: ETHERSCAN_API_TOKEN }),
		pocket: "-",
		ankr: "-",
	});
};
