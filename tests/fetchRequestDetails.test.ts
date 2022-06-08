import { fetchRequestDetails } from "@/libs/utils/fetchRequestDetails";
import { Api } from "@cennznet/api";

describe("fetchRequestDetails", () => {
	it("returns expected data", async () => {
		const mockedApi = {
			query: {
				ethStateOracle: {
					requests: jest.fn((requestId: number) => {
						if (requestId === 1)
							return Promise.resolve({
								isNone: true,
							});

						if (requestId === 2)
							return Promise.resolve({
								toJSON: jest.fn(() => ({ foo: "baz" })),
							});
					}),
				},
			},
		};

		const request1Details = await fetchRequestDetails(
			mockedApi as unknown as Api,
			1
		);

		expect(request1Details).toBeUndefined();
		expect(mockedApi.query.ethStateOracle.requests.mock.calls.length).toBe(1);

		const request2Details = await fetchRequestDetails(
			mockedApi as unknown as Api,
			2
		);

		expect(request2Details).toMatchObject({ foo: "baz" });
		expect(mockedApi.query.ethStateOracle.requests.mock.calls.length).toBe(2);
	});
});
