import Moralis from "moralis"
import { EvmChain } from "@moralisweb3/common-evm-utils"
import dotenv from 'dotenv'
import {getNativeToken, readWallets, sleep, getKeyByValue} from '../utils/common.js'
import {Table} from "console-table-printer"
import cliProgress from "cli-progress"
import {createObjectCsvWriter} from "csv-writer"
import moment from "moment"
import { AxiosError } from "axios"

dotenv.config()

await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY
})

const p = new Table({
    columns: [
        { name: 'n', color: 'green', alignment: "right"},
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
let isJson = false
let wallets = readWallets('./addresses/evm.txt')
let csvData = []
let iteration = 1
let iterations = wallets.length
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(address, index, chain, network) {
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
                if (tx.from_address.toLowerCase() === address.toLowerCase()) {
                    txs.push(tx)
                }
            }

            cursor = response.pagination.cursor
            await sleep(100)
        } while (cursor !== "" && cursor != null)
    } catch (e) {
        if (e.toString().includes('Invalid key')) {
            console.log('Moralis API reached daily limit. Upgrade to paid plan or try tomorrow')
        }
    }

    for (const tx of txs) {
        totalTx++
        totalSpent += tx.gas_price * tx.gas
        if (tx.block_timestamp) {
            const date = new Date(tx.block_timestamp)
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        }
    }

    total += totalSpent
    totalSpent = totalSpent / Math.pow(10, 18)

    p.addRow({
        'n': parseInt(index)+1,
        'Wallet': address,
        'TX Count': totalTx,
        'Days': uniqueDays.size,
        'Weeks': uniqueWeeks.size,
        'Months': uniqueMonths.size,
        'Gas spent': `${totalSpent.toFixed(4)} ${getNativeToken(network)}`,
        'First tx': txs.length ? moment(new Date(txs[txs.length - 1].block_timestamp)).format("DD.MM.YY") : '',
        'Last tx': txs.length ? moment(new Date(txs[0].block_timestamp)).format("DD.MM.YY") : ''
    })

    jsonData.push({
        'n': parseInt(index)+1,
        'Wallet': address,
        'TX Count': totalTx,
        'Days': uniqueDays.size,
        'Weeks': uniqueWeeks.size,
        'Months': uniqueMonths.size,
        'Gas spent': totalSpent.toFixed(4),
        'First tx': txs.length ? new Date(txs[txs.length - 1].block_timestamp) : '',
        'Last tx': txs.length ? new Date(txs[0].block_timestamp) : '',
        'Native token': getNativeToken(network)
    })

    progressBar.update(iteration++)
}

async function fetchBatch(batch, chain, network) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), chain, network)))
}

async function fetchWallets(chain, network) {
    wallets = readWallets('./addresses/evm.txt')
    jsonData = []
    iteration = 1
    total = 0

    const batchSize = process.env.EVM_BATCH_SIZE ? process.env.EVM_BATCH_SIZE : 3
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch, chain, network))
            }, i * (process.env.EVM_BATCH_TIMEOUT ? process.env.EVM_BATCH_TIMEOUT * 1000 : 1000 ))
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
}

async function addTotalRow(network) {
    total = total / Math.pow(10, 18) 
    p.addRow({
        'Wallet': 'Total',
        'TX Count': '',
        'Gas spent': `${total.toFixed(4)} ${getNativeToken(network)}`
    })
}

export async function evmFetchDataAndPrintTable(network) {
    progressBar.start(iterations, 0)
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
    await fetchWallets(chain, network)
    await addTotalRow(network)

    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)

    const csvWriter = createObjectCsvWriter({
        path: `./results/evm_${network}.csv`,
        header: [
            {id: 'n', title: 'n'},
            {id: 'Wallet', title: 'Wallet'},
            {id: 'TX Count', title: 'TX Count'},
            {id: 'Days', title: 'Days'},
            {id: 'Weeks', title: 'Weeks'},
            {id: 'Months', title: 'Months'},
            {id: 'Gas spent', title: 'Gas spent'},
            {id: 'First tx', title: 'First tx'},
            {id: 'Last tx', title: 'Last tx'},
        ]
    })

    csvWriter.writeRecords(csvData).then().catch()

    if (!isJson) {
        progressBar.stop()
        p.printTable()
    }
}

export async function evmData(network) {
    isJson = true
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
    await fetchWallets(chain, network)
    await addTotalRow(network)
    
    jsonData.push({
        'Wallet': 'Total',
        'TX Count': '',
        'Gas spent': total.toFixed(4),
        'Native token': getNativeToken(network)
    })

    return jsonData
}