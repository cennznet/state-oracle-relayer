import "@nomiclabs/hardhat-ethers";
import "tsconfig-paths/register";
import { TEST_ACCOUNT_SEED } from "@/tests/constants";

export default {
	solidity: {
		version: "0.8.0",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		local: {
			url: "http://localhost:9933",
			accounts: [TEST_ACCOUNT_SEED],
		},
	},
	paths: {
		root: "./tests",
		artifacts: "./contracts/.artifacts",
		cache: "./contracts/.cache",
	},
};
