const getenv = require('getenv');
import { Api } from '@cennznet/api';
import { ISubmittableResult } from '@cennznet/types';
import { Keyring } from '@polkadot/keyring';
import { ethers, BytesLike, BigNumberish, utils } from 'ethers';

const cennznetNetwork = getenv('CENNZNET_NETWORK', 'rata');
// Charlie
// pk: 0xbc1ede780f784bb6991a585e4f6e61522c14e1cae6ad0895fb57b9a205a8f938
// address (ss58): 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
const cennznetSeed = getenv('CENNZNET_SEED', '0xbc1ede780f784bb6991a585e4f6e61522c14e1cae6ad0895fb57b9a205a8f938');
const ethereumNetwork = getenv('ETHEREUM_NETWORK', 'ropsten');

// Response from an `eth_call` rpc
interface EthCallResponse {
    // eth abi encoded (raw) return data from the 'eth_call' rpc
    returnData: BytesLike,
    // The block number where returnData was retrieved
    blockNumber: BigNumberish,
    // The block timestamp
    blockTimestamp: number
}

/**
 * Make an `eth_call` rpc to the connected chain
 * 
 * @param target - target address to call
 * @param input - bytes for evm input
 */
async function ethCall(api: Api, target: string, input: BytesLike): Promise<EthCallResponse> {
    console.log(`making eth_call:${target},input:${input}`);
    const provider = ethers.getDefaultProvider(ethereumNetwork, {
    	etherscan: "W7SECH28YMK2B1FCJP2SPXBZW5WDF4VEBV",
    	infura: "-",
    	alchemy: "-",
    	pocket: "-",
    	ankr: "-"
    });
    const blockNumber = await provider.getBlockNumber();
    const { timestamp: blockTimestamp } = await provider.getBlock(blockNumber);

    const cennzTimestamp = Number((await api.query.timestamp.now()).toJSON()) / 1000;


    console.log("Block No:", blockNumber);
    console.log("Block Timestamp:", blockTimestamp);
    console.log("CENNZnet Timestamp", Number((await api.query.timestamp.now()).toJSON()) / 1000);
    console.log("Difference to now for block:", (Date.now() / 1000) - blockTimestamp);
    console.log("Difference to now for cennz:", (Date.now() / 1000) - cennzTimestamp);


    const returnData = await provider.call({
        to: target.toString(),
        data: input,
    }, blockNumber);

    return {
        returnData,
        blockNumber,
        blockTimestamp
    }
}

/*
* Run the relayer daemon
*/
async function main() {
		let apiOptions:any = {
			types: {
				ReturnDataClaim: {
					_enum: {
						Ok: "[u8; 32]",
						ExceedsLengthLimit: null,
					},
				},
			}
		}

		apiOptions[cennznetNetwork.indexOf("ws") === 0? "provider" : "network"] = cennznetNetwork;

    let api = await Api.create(apiOptions);
    let cennznetSigner = new Keyring({ 'type': 'sr25519' }).addFromSeed(cennznetSeed);
    console.log(
        `\nstate 🔮 relayer\n`+
        `  signer: ${cennznetSigner.address}\n` +
        `  cennznet: ${cennznetNetwork}\n` +
        `  ethereum: ${ethereumNetwork}\n`
    );

    await api.query.ethStateOracle.nextRequestId(async (nextRequestId: number) => {
        if(nextRequestId == 0) return;
        const requestId = nextRequestId - 1;
        const rawRequestDetails: any = await api.query.ethStateOracle.requests(requestId);
        if(rawRequestDetails.isNone) return;
        const requestDetails:any = rawRequestDetails.toJSON();

        console.log(`new request: ${requestId}\ninfo:${JSON.stringify(requestDetails)}`);

        let {returnData, blockNumber, blockTimestamp} = await ethCall(api,requestDetails.destination, requestDetails.inputData);

        const returnDataLength = utils.hexDataLength(returnData);

        if(returnDataLength < 32) {
        	console.log("return data is less than 32 ignore");
        	return;
        }

		const returnDataClaim = api.registry.createType(
			"ReturnDataClaim",
			returnDataLength === 32
			? { Ok: returnData }
			: { ExceedsLengthLimit: null }
		);

        console.log(`submitting response: ${requestId}`);
        await api.tx.ethStateOracle
            .submitCallResponse(requestId, returnDataClaim, blockNumber, blockTimestamp)
            .signAndSend(cennznetSigner, async (result: ISubmittableResult) => {
            	const { status, dispatchError } = result;

            	if (!status.isInBlock) return;

            	if (dispatchError) {
            		const cennzTimestamp = Number((await api.query.timestamp.now()).toJSON()) / 1000;
            		console.log("Etheruem:", blockTimestamp);
            		console.log("CENNZnet:", cennzTimestamp);
            		console.log("Difference:", (cennzTimestamp) - blockTimestamp);
            		return console.warn({ error: JSON.stringify(dispatchError) });
            	}


                console.log(`request: ${requestId} submitted`);
            });
    });
}

main()
    .catch((err) => console.error(err));
