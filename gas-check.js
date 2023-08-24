import Moralis from "moralis"
import * as ethers from "ethers"
import { EvmChain } from "@moralisweb3/common-evm-utils"
import dotenv from 'dotenv'
import {getNativeToken, readWallets, sleep} from "./common.js"
import {Table} from "console-table-printer";
import cliProgress from "cli-progress";

dotenv.config()

await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY
})

const p = new Table({
  columns: [
      { name: 'Wallet', color: 'green', alignment: "right"},
      { name: 'TX Count', alignment: "right", color: 'cyan' },
      { name: 'Gas spent', alignment: "right", color: 'cyan' }
  ]
})

const args = process.argv.slice(2);
const network = args[0];
let chain = EvmChain.ETHEREUM
switch (network) {
    case "polygon":
        chain = EvmChain.POLYGON
        break
    case "arbitrum":
        chain = EvmChain.ARBITRUM
        break
    case "optimism":
        chain = EvmChain.OPTIMISM
        break
    case "bsc":
        chain = EvmChain.BSC
        break
}
let total = 0;

async function checkGasSpent(address) {
    let cursor = null
    let totalTx = 0
    let totalSpent = 0

    do {
        const response = await Moralis.EvmApi.transaction.getWalletTransactions({
            address: address,
            chain: chain,
            cursor: cursor,
        })

        const result = response.toJSON()

        result.result.forEach(async (tx) => {
            totalSpent += tx.gas_price * tx.gas
            totalTx++
        })

        cursor = response.pagination.cursor
        await sleep(100)
    } while (cursor !== "" && cursor != null)

    total += totalSpent
    totalSpent = totalSpent / Math.pow(10, 18)

    const walletRow = {
        'Wallet': address,
        'TX Count': totalTx,
        'Gas spent': `${totalSpent.toFixed(4)} ${getNativeToken(network)}`
    }

    p.addRow(walletRow)
}

const wallets = readWallets('./addresses/evm.txt')

let iteration = 1;
let iterations = wallets.length
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(iterations, 0);

for (let wallet of wallets) {
    await checkGasSpent(wallet)
    progressBar.update(iteration++);

    if (!--iterations) {
        progressBar.stop();

        const totalRow = {
            'Wallet': 'TOTAL',
            'TX Count': '',
            'Gas spent': `${ethers.utils.formatEther(total.toString())} ${getNativeToken(network)}`
        }

        p.addRow(totalRow)

        p.printTable()
    }
}
