import { ETHEREUM_NETWORK } from "@/libs/constants";
import { ethers } from "ethers";

export const getEthersProvider = (): ethers.providers.BaseProvider => {
	return ethers.getDefaultProvider(ETHEREUM_NETWORK);
};
