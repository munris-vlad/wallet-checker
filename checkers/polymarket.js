import '../utils/common.js'
import {
    readWallets,
    getKeyByValue,
    getProxy,
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import { createPublicClient, formatUnits, http } from 'viem'
import { polygon } from 'viem/chains'
import { abiToken } from '../utils/abi.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'USDC', alignment: 'right', color: 'cyan' },
    { name: 'Positions Value', alignment: 'right', color: 'cyan' },
    { name: 'PnL', alignment: 'right', color: 'cyan' },
    { name: 'Volume', alignment: 'right', color: 'cyan' },
    { name: 'Markets', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'USDC', title: 'USDC' },
    { id: 'Positions Value', title: 'Positions Value' },
    { id: 'PnL', title: 'PnL' },
    { id: 'Volume', title: 'Volume' },
    { id: 'Markets', title: 'Markets' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('polymarket')
}

let p
let csvWriter
let stats = []
let wallets = config.modules.polymarket ? readWallets(config.modules.polymarket.addresses) : []
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let total = {
    usdc: 0
}
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function createAxiosInstance() {
    const agent = getProxy()

    if (agent) {
        return axios.create({
            httpsAgent: agent,
            timeout: cancelTimeout
        })
    } else {
        return axios.create()
    }
}

async function getBalances(wallet) {
    const client = createPublicClient({
        chain: polygon,
        transport: http(),
    })

    const amount = await client.readContract({
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        abi: abiToken,
        functionName: 'balanceOf',
        args: [
            wallet
        ]
    })

    const balance = formatUnits(amount, 6)
    return parseFloat(balance)
}

async function getData(wallet) {
    const instance = createAxiosInstance()
    const [volumeRes, tradedRes, valueRes, profitRes] = await Promise.all([
        instance.get(`https://lb-api.polymarket.com/volume?window=all&limit=1&address=${wallet}`),
        instance.get(`https://data-api.polymarket.com/traded?user=${wallet}`),
        instance.get(`https://data-api.polymarket.com/value?user=${wallet}`),
        instance.get(`https://lb-api.polymarket.com/profit?window=all&limit=1&address=${wallet}`),
    ])

    const volumeTraded = parseFloat(volumeRes.data?.[0]?.amount ?? 0)
    const marketsTraded = parseInt(tradedRes.data?.traded ?? 0, 10)
    const positionsValue = parseFloat(valueRes.data?.[0]?.value ?? 0)
    const profitLoss = parseFloat(profitRes.data?.[0]?.amount ?? 0)

    stats[wallet].position_value = positionsValue
    stats[wallet].pnl = profitLoss
    stats[wallet].volume = volumeTraded
    stats[wallet].markets = marketsTraded
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'polymarket')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            position_value: 0,
            pnl: 0,
            volume: 0,
            markets: 0,
            balances: { USDC: 0 },
        }

        await getBalances(wallet)
        await getData(wallet)
    }

    progressBar.update(iteration)
    total.usdc += stats[wallet].balances['USDC'] ? parseFloat(stats[wallet].balances['USDC']) : 0

    p.addRow({
        n: parseInt(index) + 1,
        wallet: wallet,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'Positions Value': '$' + stats[wallet].position_value.toFixed(2),
        'PnL': '$' + stats[wallet].pnl.toFixed(2),
        'Volume': '$' + stats[wallet].volume.toFixed(2),
        'Markets': stats[wallet].markets
    })

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'Positions Value': stats[wallet].position_value.toFixed(2),
        'PnL': stats[wallet].pnl.toFixed(2),
        'Volume': stats[wallet].volume.toFixed(2),
        'Markets': stats[wallet].markets
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'polymarket', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = config.modules.polymarket ? readWallets(config.modules.polymarket.addresses) : []
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        usdc: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/polymarket.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('polymarket')

    if (walletsInDB === wallets.length) {
        batchSize = walletsInDB
        timeout = 0
    }

    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * timeout)
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

async function addTotalRow() {
    p.addRow({})
    p.addRow({
        wallet: 'Total',
        'USDC': total.usdc.toFixed(2),
    })
}

export async function polymarketFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function polymarketData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'USDC': total.usdc.toFixed(2),
    })

    return jsonData
}

export async function polymarketFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function polymarketClean() {
    await cleanByChecker('polymarket')
}