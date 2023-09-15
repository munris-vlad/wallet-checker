import Moralis from "moralis"
import { EvmChain } from "@moralisweb3/common-evm-utils"
import dotenv from 'dotenv'
import {getNativeToken, readWallets, sleep} from '../utils/common.js'
import {Table} from "console-table-printer"
import cliProgress from "cli-progress"
import {createObjectCsvWriter} from "csv-writer"
import moment from "moment"

dotenv.config()

await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY
})

const p = new Table({
    columns: [
        { name: 'Wallet', color: 'green', alignment: "right"},
        { name: 'TX Count', alignment: "right", color: 'cyan' },
        { name: 'Days', alignment: 'right', color: 'cyan'},
        { name: 'Weeks', alignment: 'right', color: 'cyan'},
        { name: 'Months', alignment: 'right', color: 'cyan'},
        { name: 'Gas spent', alignment: "right", color: 'cyan' },
        { name: 'First tx', alignment: 'right', color: 'cyan'},
        { name: 'Last tx', alignment: 'right', color: 'cyan'},
    ]
})

let total = 0
let jsonData = []

async function fetchWallet(address, chain, network) {
    let cursor = null
    let totalTx = 0
    let totalSpent = 0
    let txs = []
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    try {
        do {
            const response = await Moralis.EvmApi.transaction.getWalletTransactions({
                address: address,
                chain: chain,
                cursor: cursor,
            })

            const result = response.toJSON()

            for (const tx of result.result) {
                txs.push(tx)
            }

            cursor = response.pagination.cursor
            await sleep(100)
        } while (cursor !== "" && cursor != null)
    } catch (e) {}

    for (const tx of txs) {
        if (tx.from_address === address.toLowerCase()) {
            totalTx++
            totalSpent += tx.gas_price * tx.gas
            if (tx.block_timestamp) {
                const date = new Date(tx.block_timestamp)
                uniqueDays.add(date.toDateString())
                uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
                uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            }
        }
    }

    total += totalSpent
    totalSpent = totalSpent / Math.pow(10, 18)

    const walletRow = {
        'n': iteration,
        'Wallet': address,
        'TX Count': totalTx,
        'Days': uniqueDays.size,
        'Weeks': uniqueWeeks.size,
        'Months': uniqueMonths.size,
        'Gas spent': `${totalSpent.toFixed(4)} ${getNativeToken(network)}`,
        'First tx': txs.length ? moment(new Date(txs[txs.length - 1].block_timestamp)).format("DD.MM.YY") : '',
        'Last tx': txs.length ? moment(new Date(txs[0].block_timestamp)).format("DD.MM.YY") : ''
    }

    p.addRow(walletRow)
    jsonData.push(walletRow)
}

const wallets = readWallets('./addresses/evm.txt')

let csvData = []
let iteration = 1
let iterations = wallets.length
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progressBar.start(iterations, 0)

async function fetchBalances(chain, network) {
    for (let wallet of wallets) {
        await fetchWallet(wallet, chain, network)
        progressBar.update(iteration++)

        if (!--iterations) {
            progressBar.stop()
            total = total / Math.pow(10, 18)
            const totalRow = {
                'Wallet': 'TOTAL',
                'TX Count': '',
                'Gas spent': `${total.toFixed(4)} ${getNativeToken(network)}`
            }

            jsonData.push(totalRow)
            p.addRow(totalRow)

            p.printTable()

            p.table.rows.map((row) => {
                csvData.push(row.text);
            })

            const csvWriter = createObjectCsvWriter({
                path: `./results/evm_${network}.csv`,
                header: [
                    { id: 'Wallet', title: 'Wallet'},
                    { id: 'TX Count', title: 'TX Count'},
                    { id: 'Days', title: 'Days'},
                    { id: 'Weeks', title: 'Weeks'},
                    { id: 'Months', title: 'Months'},
                    { id: 'Gas spent', title: 'Gas spent'},
                    { id: 'First tx', title: 'First tx'},
                    { id: 'Last tx', title: 'Last tx'},
                ]
            })

            csvWriter.writeRecords(csvData)
                .then(() => console.log('Запись в CSV файл завершена'))
                .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error));
        }
    }
}

export async function evmFetchDataAndPrintTable(network) {
    let chain
    switch (network) {
        case "eth":
            chain = EvmChain.ETHEREUM
            break
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
    await fetchBalances(chain, network)
}

export async function evmData(network) {
    jsonData = []
    total = 0
    let chain
    switch (network) {
        case "eth":
            chain = EvmChain.ETHEREUM
            break
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
    await fetchBalances(chain, network)

    return jsonData
}