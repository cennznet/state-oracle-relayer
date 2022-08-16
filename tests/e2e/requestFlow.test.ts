import { TEST_ACCOUNT_KEY, TEST_TOKEN_ADDRESS } from "@/tests/constants";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Contract, Wallet } from "ethers";

const { resolve } = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

describe("requestFlow", () => {
	it("should receive expected return data", async () => {
		const provider = new JsonRpcProvider("http://localhost:9933");
		const { abi } = require(resolve(
			__dirname,
			"../contracts/.artifacts/contracts/StateOracle.sol/StateOracle.json"
		));
		const {
			contract: contractAddress,
			signer: signerKey,
			token: tokenAddress,
		} = yargs(hideBin(process.argv))
			.option("contract", {
				type: "string",
				require: true,
			})
			.option("token", {
				type: "string",
				require: false,
				default: TEST_TOKEN_ADDRESS,
			})
			.option("signer", {
				type: "string",
				require: false,
				default: TEST_ACCOUNT_KEY,
			})
			.parse();

		const wallet = new Wallet(signerKey, provider);
		const contract = new Contract(contractAddress, abi, wallet);

		const {
			sendRequestId,
			receiveRequestId,
			requestTimestamp,
			requestReturnData,
		} = await interactWithContract(contract, tokenAddress);

		expect(sendRequestId!?.toString()).toEqual(receiveRequestId?.toString());
		expect(requestTimestamp!.gt(0)).toBe(true);
		expect(requestReturnData!.gt(0)).toBe(true);
	}, 60000);
});

async function interactWithContract(
	contract: Contract,
	tokenAddress: string
): Promise<{
	sendRequestId: BigNumber;
	receiveRequestId: BigNumber;
	requestTimestamp: BigNumber;
	requestReturnData: BigNumber;
}> {
	let sendRequestId: BigNumber;
	contract.on("HiToEthereum", (id: BigNumber) => {
		sendRequestId = id;
	});

	const tx = await contract.helloEthereum(tokenAddress);

	return new Promise((resolve) => {
		let receiveRequestId: BigNumber,
			requestTimestamp: BigNumber,
			requestReturnData: BigNumber;

		contract.on(
			"HiFromEthereum",
			(id: BigNumber, timestamp: BigNumber, returnData: BigNumber) => {
				receiveRequestId = id;
				requestTimestamp = timestamp;
				requestReturnData = returnData;

				tx.wait(10).then(() => {
					resolve({
						sendRequestId,
						receiveRequestId,
						requestTimestamp,
						requestReturnData,
					});
				});
			}
		);
	});
}
