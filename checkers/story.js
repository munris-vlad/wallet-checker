import '../utils/common.js'
import {
    sleep,
    readWallets,
    getBalance,
    getKeyByValue,
    getProxy,
    newAbortSignal,
    ethPrice,
    timestampToDate,
    ipPrice
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import { formatEther, parseEther } from 'viem'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'IP', alignment: 'right', color: 'cyan' },
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
    { id: 'IP', title: 'IP' },
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
    cleanByChecker('story')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.story.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let apiUrl = 'https://storyscan.xyz/api/v2/addresses'
let total = {
    ip: 0
}
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const reqHeaders = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\", \"Not?A_Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "origin-when-cross-origin"
}

async function getBalances(wallet) {
    let ipBalanceDone
    let ipBalanceRetry = 0

    let badgeBalanceDone
    let badgeBalanceRetry = 0

    while (!ipBalanceDone) {
        await axios.get(`${apiUrl}/${wallet}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            stats[wallet].balances['IP'] = formatEther(parseEther(response.data.coin_balance)) / Math.pow(10, 18)
            ipBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)
            ipBalanceRetry++
            if (ipBalanceRetry > 3) {
                ipBalanceDone = true
            }
        })
    }

    while (!badgeBalanceDone) {
        await axios.get(`${apiUrl}/${wallet}/tokens?type=ERC-721`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            const tokens = response.data.items
            for (const token of tokens) {
                stats[wallet].balances[token.token.symbol] = 1
            }
            badgeBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            badgeBalanceRetry++
            if (badgeBalanceRetry > 3) {
                badgeBalanceDone = true
            }
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
        block_number: '',
        index: '',
        items_count: ''
    }
    let isAllTxCollected = false, retry = 0

    while (!isAllTxCollected && retry < 3) {
        await axios.get(`${apiUrl}/${wallet}/transactions`, {
            params: params.block_number === '' ? {} : params,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.items

            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (response.data.next_page_params === null) {
                isAllTxCollected = true
            } else {
                params = response.data.next_page_params
            }
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retry++
        })
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())

        if (tx.from) {
            if (tx.from.hash.toLowerCase() === wallet.toLowerCase()) {
                if (tx.to) {
                    uniqueContracts.add(tx.to.hash)
                }
            }
        }
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size
    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].timestamp)
        stats[wallet].last_tx_date = new Date(txs[0].timestamp)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'story')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            txcount: 0,
            balances: { IP: 0 },
        }

        await getBalances(wallet)
        await getTxs(wallet)
    }

    progressBar.update(iteration)
    total.ip += stats[wallet].balances['IP'] ? parseFloat(stats[wallet].balances['IP']) : 0
    let usdIpValue = (stats[wallet].balances['IP']*ipPrice).toFixed(2)

    p.addRow({
        n: parseInt(index) + 1,
        wallet: wallet,
        'IP': parseFloat(stats[wallet].balances['IP']).toFixed(4) + ` ($${usdIpValue})`,
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
        'IP': parseFloat(stats[wallet].balances['IP']).toFixed(4),
        'IP USDVALUE': usdIpValue,
        'TX Count': stats[wallet].txcount,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'story', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.story.addresses)
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        ip: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/story.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('story')

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
        'IP': total.ip.toFixed(4) + ` ($${(total.ip*ipPrice).toFixed(2)})`,
    })
}

export async function storyFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function storyData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'IP': total.ip.toFixed(4),
        'IP USDVALUE': (total.ip*ipPrice).toFixed(2),
    })

    return jsonData
}

export async function storyFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function storyClean() {
    await cleanByChecker('story')
}