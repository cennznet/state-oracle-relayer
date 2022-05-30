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

		const tx = await contract.helloEthereum(tokenAddress);
		const { requestId, requestTimestamp, requestReturnData } =
			await waitForResponse(contract);

		await tx.wait(5);

		expect(requestId!.gt(0)).toBe(true);
		expect(requestTimestamp!.gt(0)).toBe(true);
		expect(requestReturnData!.gt(0)).toBe(true);
	}, 60000);
});

function waitForResponse(contract: Contract): Promise<{
	requestId: BigNumber;
	requestTimestamp: BigNumber;
	requestReturnData: BigNumber;
}> {
	return new Promise((resolve) => {
		let requestId: BigNumber,
			requestTimestamp: BigNumber,
			requestReturnData: BigNumber;

		contract.on("HiToEthereum", (id: BigNumber) => {
			requestId = id;
		});

		contract.on(
			"HiFromEthereum",
			(id: BigNumber, timestamp: BigNumber, returnData: BigNumber) => {
				if (id.toString() !== requestId.toString())
					throw { message: "`requestId` is mismatched" };
				requestTimestamp = timestamp;
				requestReturnData = returnData;

				resolve({ requestId, requestTimestamp, requestReturnData });
			}
		);
	});
}
