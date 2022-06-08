import type { Api } from "@cennznet/api";

describe("submitResponseToCENNZ", () => {
	beforeAll(() => {
		jest.mock("@polkadot/keyring", () => {
			return class Keyring {
				addFromSeed() {
					return "0x0";
				}
			};
		});
	});

	it("throws error if `returnData` is less than 32 bytes", async () => {
		const {
			submitResponseToCENNZ,
		} = require("@/libs/utils/submitResponseToCENNZ");

		try {
			await submitResponseToCENNZ({} as unknown as Api, 1, "0x0", 1, 1);
		} catch (error: any) {
			expect(error.code).toBe("INVALID_RETURN_DATA");
		}
	});

	it("submit appropriate `ReturnDataClaim` depends on the returnData byte-size", async () => {
		const mockedApi = {
			registry: {
				createType: jest.fn((type, output) => output),
			},
			tx: {
				ethStateOracle: {
					submitCallResponse: jest.fn(() => ({
						signAndSend: jest.fn((signer, callback) =>
							callback({ status: { isInBlock: true } })
						),
					})),
				},
			},
		};

		const {
			submitResponseToCENNZ,
		} = require("@/libs/utils/submitResponseToCENNZ");
		const returnDataOk = getHexString(32);
		const returnDataExcced = getHexString(33);
		const requestId = 1;
		const blockNumber = 1;
		const blockTimestamp = 1;
		await submitResponseToCENNZ(
			mockedApi as unknown as Api,
			requestId,
			returnDataOk,
			blockNumber,
			blockTimestamp
		);
		await submitResponseToCENNZ(
			mockedApi as unknown as Api,
			requestId,
			returnDataExcced,
			blockNumber,
			blockTimestamp
		);

		const submitOKCall: any[] =
			mockedApi.tx.ethStateOracle.submitCallResponse.mock.calls[0];

		const submitExceedCall: any[] =
			mockedApi.tx.ethStateOracle.submitCallResponse.mock.calls[1];

		expect(submitOKCall).toEqual([
			requestId,
			{
				Ok: returnDataOk,
			},
			blockNumber,
			blockTimestamp,
		]);

		expect(submitExceedCall).toEqual([
			requestId,
			{ ExceedsLengthLimit: null },
			blockNumber,
			blockTimestamp,
		]);
	});

	it("throws error if there is `dispatchError` in submit result", async () => {
		const dispatchError = {
			toJSON: () => {
				foo: "baz";
			},
		};

		const mockedApi = {
			registry: {
				createType: jest.fn((type, output) => output),
			},
			tx: {
				ethStateOracle: {
					submitCallResponse: jest.fn(() => ({
						signAndSend: jest.fn((signer, callback) =>
							callback({
								status: { isInBlock: true },
								dispatchError,
							})
						),
					})),
				},
			},
		};

		const {
			submitResponseToCENNZ,
		} = require("@/libs/utils/submitResponseToCENNZ");
		try {
			await submitResponseToCENNZ(mockedApi, 1, getHexString(32), 1, 1);
		} catch (error: any) {
			expect(error.code).toBe("CENNZ_DISPATCH_ERROR");
			expect(error.error).toEqual(JSON.stringify(dispatchError.toJSON()));
		}
	});
});

function getHexString(bytesLength: number): string {
	return `0x${new Array(bytesLength * 2).fill("0").join("")}`;
}
