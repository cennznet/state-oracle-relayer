import { getCENNZnetApi } from "@/libs/utils/getCENNZnetApi";
import { getLogger } from "@/libs/utils/getLogger";
import { TEST_ACCOUNT_ADDRESS } from "@/tests/constants";
import { Api } from "@cennznet/api";
import { cvmToAddress } from "@cennznet/types/utils";
import Keyring from "@polkadot/keyring";
import { ethers } from "hardhat";
import chalk from "chalk";

const { resolve } = require("path");

const logger = getLogger("E2E");

Promise.all([getCENNZnetApi()])
	.then(async ([cennzApi]) => {
		//1. Fund CPAY to test account
		await fundGasToAccount(cennzApi, TEST_ACCOUNT_ADDRESS);

		//2. Deploy new StateOracle contract to the CENNZNet
		const contractAddress = await deployContract();

		//3. Fund CPAY to Contract Address
		await fundGasToAccount(cennzApi, contractAddress);

		logger.info(
			`
Contract: ${chalk.magenta("%s")}
Account: ${chalk.magenta("%s")}

Prep done ✅`,
			contractAddress,
			TEST_ACCOUNT_ADDRESS
		);

		process.exit(0);
	})
	.catch((error) => {
		logger.error(error);
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
