import '../utils/common.js'
import {
    readWallets,
    getKeyByValue,
    getProxy,
    newAbortSignal,
    ethPrice,
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import { formatEther, formatUnits, parseEther } from 'viem'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'Domain', color: 'green', alignment: "right" },
    { name: 'ETH', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Volume', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'Domain', title: 'Domain' },
    { id: 'ETH', title: 'ETH' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Volume', title: 'Volume' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('eclipse')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.eclipse.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let total = {
    eth: 0,
    gas: 0,
}
const apiUrl = 'https://api.eclipsescan.xyz/v1'
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const reqHeaders = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://explorer.eclipse.build/",
    "Referrer-Policy": "origin-when-cross-origin"
}

async function getBalances(wallet) {
    let ethBalanceDone
    let ethBalanceRetry = 0

    while (!ethBalanceDone) {
        await axios.get(`${apiUrl}/account?address=${wallet}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            stats[wallet].balances['ETH'] = response.data.data.lamports ? formatUnits(response.data.data.lamports, 9) : 0
            ethBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)
            ethBalanceRetry++
            if (ethBalanceRetry > 3) {
                ethBalanceDone = true
            }
        })
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    let volume = 0

    let txs = []
    let uniqueTxs = []
    let params = {
        page_size: 10,
        page: 1
    }
    let isAllTxCollected = false, retry = 0

    while (!isAllTxCollected && retry < 3) {
        await axios.get(`${apiUrl}/account/transaction?address=${wallet}`, {
            params: params,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.data.transactions
           
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            const firstKey = Object.keys(response.data.metadata.accounts)[0]
            stats[wallet].domain = response.data.metadata.accounts[firstKey] ? response.data.metadata.accounts[firstKey].account_domain : ''

            if (items.length < params.page_size || items[items.length - 1].txHash === params.before) {
                isAllTxCollected = true
            }

            if (items.length) {
                params.before = items[items.length - 1].txHash
            }
            params.page++
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retry++
        })
    }

    if (txs.length > 0) {
        uniqueTxs = Array.from(
            new Map(txs.map(obj => [obj.txHash, obj])).values()
        )
    }

    stats[wallet].txcount = uniqueTxs.length

    Object.values(uniqueTxs).forEach(tx => {
        const date = new Date(tx.blockTime * 1000)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())

        volume += parseInt(tx.sol_value)
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    if (uniqueTxs.length) {
        stats[wallet].first_tx_date = new Date(uniqueTxs[uniqueTxs.length - 1].blockTime * 1000)
        stats[wallet].last_tx_date = new Date(uniqueTxs[0].blockTime * 1000)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].volume = parseFloat(formatUnits(volume, 9)) * ethPrice
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'eclipse')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            txcount: 0,
            volume: 0,
            balances: { ETH: 0 },
        }

        await getBalances(wallet)
        await getTxs(wallet)
    }

    progressBar.update(iteration)
    total.eth += stats[wallet].balances['ETH'] ? parseFloat(stats[wallet].balances['ETH']) : 0

    let usdEthValue = (stats[wallet].balances['ETH'] * ethPrice).toFixed(2)
    p.addRow({
        n: parseInt(index) + 1,
        wallet: wallet,
        'Domain': stats[wallet].domain,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume.toFixed(2),
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '-',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '-',
    })

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        'Domain': stats[wallet].domain,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume.toFixed(2),
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'eclipse', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.eclipse.addresses)
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        eth: 0,
        gas: 0,
    }

    csvWriter = createObjectCsvWriter({
        path: './results/eclipse.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('eclipse')

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
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth * ethPrice).toFixed(2)})`,
    })
}

export async function eclipseFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function eclipseData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'ETH': total.eth.toFixed(4),
        'ETH USDVALUE': (total.eth * ethPrice).toFixed(2),
    })

    return jsonData
}

export async function eclipseFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function eclipseClean() {
    await cleanByChecker('eclipse')
}