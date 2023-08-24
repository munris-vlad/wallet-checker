import * as accs from './accs.js';
import { AnkrProvider } from '@ankr.com/ankr.js';
import dotenv from 'dotenv';
import {readWallets} from "./common.js";

dotenv.config();

const provider = new AnkrProvider('https://rpc.ankr.com/multichain/'+process.env.ANKR_API_KEY);

const balances = async (address, index, network = 'eth', contract = null) => {
    let data = {};
    if (contract) {
        data = await provider.getNFTsByOwner({
            walletAddress: address,
            blockchain: network,
            filter: [
                { [contract]: [] }
            ]
        });
    } else {
        data = await provider.getNFTsByOwner({
            walletAddress: address,
            blockchain: network
        });
    }
    
    if (data.assets.length > 0) {
        console.log(address);
    }
};


const wallets = readWallets('wallets.txt')
const args = process.argv.slice(2);
const network = args[0];
const contract = args[1];

function fetchBalances() {
    const balancePromises = wallets.map((account, index) => balances(account, index, network, contract));
    return Promise.all(balancePromises);
}

async function fetchDataAndPrintTable() {
    await fetchBalances();
}

fetchDataAndPrintTable().catch(error => {
    console.error('Произошла ошибка:', error);
});

