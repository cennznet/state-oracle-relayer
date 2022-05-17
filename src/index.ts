const getenv = require('getenv');
import { Api } from '@cennznet/api';
import { ISubmittableResult } from '@cennznet/types';
import { Keyring } from '@polkadot/keyring';
import { ethers, BytesLike, BigNumberish } from 'ethers';

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
}

/**
 * Make an `eth_call` rpc to the connected chain
 * 
 * @param target - target address to call
 * @param input - bytes for evm input
 */
async function ethCall(target: string, input: BytesLike): Promise<EthCallResponse> {
    console.log(`making eth_call:${target},input:${input}`);
    let provider = ethers.getDefaultProvider(ethereumNetwork);
    let blockNumber = await provider.getBlockNumber();
    let returnData = await provider.call({
        to: target.toString(),
        data: input,
    }, blockNumber);

    return {
        returnData,
        blockNumber,
    }
}

/*
* Run the relayer daemon
*/
async function main() {
    let api = await Api.create({ network: cennznetNetwork });
    let cennznetSigner = new Keyring({ 'type': 'sr25519' }).addFromSeed(cennznetSeed);
    console.log(
        `\nstate 🔮 relayer\n`+
        `  signer: ${cennznetSigner.address}\n` +
        `  cennznet: ${cennznetNetwork}\n` +
        `  ethereum: ${ethereumNetwork}\n`
    );

    await api.query.ethStateOracle.nextRequestId(async (nextRequestId: number) => {
        if(nextRequestId == 0) return;
        let requestId = nextRequestId - 1;
        let requestInfo = (await api.query.ethStateOracle.requests(requestId) as any);
        if(requestInfo.isNone) return;

        let requestInputData = (await api.query.ethStateOracle.requestInputData(requestId) as any);
        console.log(`new request: ${requestId}\ninfo:${requestInfo.unwrap().toString()}`);

        let {returnData, blockNumber} = await ethCall(requestInfo.unwrap().destination, requestInputData);

        console.log(`submitting response: ${requestId}`);
        await api.tx.ethStateOracle
            .submitCallResponse(requestId, returnData, blockNumber)
            .signAndSend(cennznetSigner, (status: ISubmittableResult) => {
                if(status.isInBlock) {
                    console.log(`request: ${requestId} submitted`);
                }
            });
    });
}

main()
    .catch((err) => console.error(err));
