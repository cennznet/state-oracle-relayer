import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { waitForBlock } from "@/libs/utils/waitForBlock";
import { TEST_ACCOUNT_ADDRESS } from "@/tests/constants";
import { Api } from "@cennznet/api";
import { cvmToAddress } from "@cennznet/types/utils";
import Keyring from "@polkadot/keyring";
import { ethers } from "hardhat";
import chalk from "chalk";

const { resolve } = require("path");

const logger = getLogger("E2E-PREP");

Promise.all([getCENNZnetApi()])
	.then(async ([cennzApi]) => {
		//1. Fund CPAY to test account
		logger.info(
			"[1/3] Transferring CPAY to test account %s...",
			TEST_ACCOUNT_ADDRESS
		);
		await fundGasToAccount(cennzApi, TEST_ACCOUNT_ADDRESS);
		await waitForBlock(cennzApi, 1);

		//2. Deploy new StateOracle contract to the CENNZNet
		logger.info("[2/3] Deploying test contract...", TEST_ACCOUNT_ADDRESS);
		const contractAddress = await deployContract();
		await waitForBlock(cennzApi, 1);

		// 3. Fund CPAY to Contract Address
		logger.info(
			"[3/3] Transferring CPAY to contract account %s...",
			contractAddress
		);
		await fundGasToAccount(cennzApi, contractAddress);
		await waitForBlock(cennzApi, 1);

		logger.info(
			`

${chalk.green("Prep done")} 🎉
Contract: ${chalk.magenta("%s")}
Account: ${chalk.magenta("%s")}`,
			contractAddress,
			TEST_ACCOUNT_ADDRESS
		);

		process.exit(0);
	})
	.catch((error) => {
		logger.error("%s", error?.message);
		process.exit(1);
	});

async function deployContract() {
	const { abi, bytecode } = require(resolve(
		__dirname,
		"../contracts/.artifacts/contracts/StateOracle.sol/StateOracle.json"
	));

	const StateOracle = await ethers.getContractFactory(abi, bytecode);
	const contract = await StateOracle.deploy({ gasLimit: 3000000 });
	await contract.deployed();

	return contract.address;
}

async function fundGasToAccount(cennzApi: Api, address: string) {
	const cennzAddress = cvmToAddress(address);
	const alice = getAliceKey();

	await cennzApi.tx.genericAsset
		.transfer(16001, cennzAddress, 10000 * Math.pow(10, 4))
		.signAndSend(alice);
}

function getAliceKey() {
	const keyring = new Keyring({ type: "sr25519" });
	return keyring.addFromUri("//Alice");
}
