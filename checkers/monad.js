import '../utils/common.js'
import {
    sleep,
    readWallets,
    getBalance,
    getKeyByValue,
    getProxy,
    newAbortSignal,
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'MON', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Contracts', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'MON', title: 'MON' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Contracts', title: 'Contracts' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('monad')
}

let p
let csvWriter
let stats = []
let wallets = config.modules.monad ? readWallets(config.modules.monad.addresses) : []
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let apiUrl = 'https://api.socialscan.io/monad-testnet/v1/explorer/address/'
let total = {
    eth: 0
}
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const reqHeaders = {
    "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": "https://monad-testnet.socialscan.io/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
}

async function getBalances(wallet) {
    let monBalanceDone
    let monBalanceRetry = 0

    while (!monBalanceDone && monBalanceRetry < 3) {
        await axios.get(`${apiUrl}/${wallet}/profile`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(),
        }).then(async response => {
            stats[wallet].balances['MON'] = parseFloat(response.data.balance).toFixed(2)
            monBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)
            monBalanceRetry++
        })
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let txs = []
    let params = {
        cursor: '',
    }
    let isAllTxCollected = false, retry = 0

    while (!isAllTxCollected && retry < 3) {
        await axios.get(`https://api.socialscan.io/monad-testnet/v1/explorer/transactions?size=10000&page=1&address=${wallet}`, {
            params: params.cursor === '' ? {} : params,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.data

            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            isAllTxCollected = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retry++
        })
    }

    Object.values(txs).forEach(tx => {
        if (tx.from_address) {
            if (tx.from_address.toLowerCase() === wallet.toLowerCase()) {
                stats[wallet].txcount++
                const date = new Date(tx.create_time)
                uniqueDays.add(date.toDateString())
                uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
                uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
                if (tx.to_address) {
                    uniqueContracts.add(tx.to_address)
                }
            }
        }
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size
    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].create_time)
        stats[wallet].last_tx_date = new Date(txs[0].create_time)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'monad')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            txcount: 0,
            balances: { MON: 0 },
        }

        await getBalances(wallet)
        await getTxs(wallet)
    }

    progressBar.update(iteration)
    total.mon += stats[wallet].balances['MON'] ? parseFloat(stats[wallet].balances['MON']) : 0

    p.addRow({
        n: parseInt(index) + 1,
        wallet: wallet,
        'MON': parseFloat(stats[wallet].balances['MON']).toFixed(4),
        'TX Count': stats[wallet].txcount,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '-',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '-',
    })

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        'MON': parseFloat(stats[wallet].balances['MON']).toFixed(4),
        'TX Count': stats[wallet].txcount,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'monad', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = config.modules.monad ? readWallets(config.modules.monad.addresses) : []
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        mon: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/monad.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('monad')

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
        'MON': total.mon.toFixed(2),
    })
}

export async function monadFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function monadData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'MON': total.mon.toFixed(2),
    })

    return jsonData
}

export async function monadFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function monadClean() {
    await cleanByChecker('monad')
}