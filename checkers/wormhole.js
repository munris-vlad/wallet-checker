import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, getProxy } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Source chains', alignment: 'right', color: 'cyan' },
    { name: 'Dest chains', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First TX', alignment: 'right', color: 'cyan' },
    { name: 'Last TX', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Source chains', title: 'Source chains' },
    { id: 'Dest chains', title: 'Dest chains' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First TX', title: 'First TX' },
    { id: 'Last TX', title: 'Last TX' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('wormhole')
}

let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.wormhole.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function getQueryHeaders() {
    return {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
        "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://wormholescan.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    let agent = getProxy(index)

    let data = {
        wallet: wallet,
        tx_count: 0,
        source_chain_count: 0,
        dest_chain_count: 0,
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: ''
    }

    let txs = []
    let isTxParsed = false
    let retry = 0
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()

    const existingData = await getWalletFromDB(wallet, 'wormhole')

    if (existingData && !isFetch) {
        data = JSON.parse(existingData)
    } else {
        while (!isTxParsed) {
            await axios.get(`https://api.wormholescan.io/api/v1/transactions?address=${wallet}&page=0&pageSize=500&sortOrder=DESC`, {
                headers: getQueryHeaders(),
                httpsAgent: agent,
                signal: newAbortSignal(5000)
            }).then(response => {
                txs = response.data.transactions
                isTxParsed = true
            }).catch(error => {
                if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
                retry++

                agent = getProxy(index, true)

                if (retry >= 3) {
                    isTxParsed = true
                }
            })
        }
        
        if (txs.length) {
            data.tx_count = txs.length
            for (const tx of Object.values(txs)) {
                const date = new Date(tx.timestamp)
                uniqueDays.add(date.toDateString())
                uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
                uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
                uniqueSource.add(tx.emitterChain)
                if (tx.payload) {
                    uniqueDestination.add(tx.payload.targetChainId)
                }
            }

            data.first_tx = new Date(txs[txs.length - 1].timestamp)
            data.last_tx = new Date(txs[0].timestamp)
            data.source_chain_count = uniqueSource.size
            data.dest_chain_count = uniqueDestination.size
            data.days = uniqueDays.size
            data.weeks = uniqueWeeks.size
            data.months = uniqueMonths.size
        }
    }

    progressBar.update(iteration)
    
    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.first_tx ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last TX': data.last_tx ? moment((data.last_tx)).format("DD.MM.YY") : '-',
    }

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.first_tx,
        'Last TX': data.last_tx,
    }

    p.addRow(row)
    jsonData.push(jsonRow)

    if (data.tx_count > 0) {
        await saveWalletToDB(wallet, 'wormhole', JSON.stringify(data))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.wormhole.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/wormhole.csv',
        header: headers
    })

    let batchSize = 50
    let timeout = 5000

    const walletsInDB = await getCountByChecker('wormhole')

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

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function wormholeFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function wormholeData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}

export async function wormholeFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function wormholeClean() {
    await cleanByChecker('wormhole')
}