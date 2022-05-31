import { callEthereum } from "@/libs/utils/callEthereum";
import { BaseProvider } from "@ethersproject/providers";

describe("callEthereum", () => {
	it("uses BaseProvider as expected", async () => {
		const mockedProvider = {
			getBlockNumber: jest.fn(() => Promise.resolve(1)),
			getBlock: jest.fn(() => Promise.resolve({ timestamp: 2 })),
			call: jest.fn(() => Promise.resolve("0x2")),
		};

		const target = "0x1";
		const input = "0x0";

		const { returnData, blockNumber, blockTimestamp } = await callEthereum(
			mockedProvider as unknown as BaseProvider,
			target,
			input
		);

		expect(returnData).toBe("0x2");
		expect(blockNumber).toBe(1);
		expect(blockTimestamp).toBe(2);
		expect((mockedProvider.call.mock.calls[0] as any)[0]).toMatchObject({
			to: target,
			data: input,
		});
		expect((mockedProvider.call.mock.calls[0] as any)[1]).toBe(1);
	});
});
