import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"

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


let debug = false
let p
let csvWriter
let wallets = readWallets('./addresses/zkbridge.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function getQueryHeaders() {
    return {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referer": "https://zkbridgescan.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
}


async function fetchWallet(wallet, index, isExtended) {

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

    while (!isTxParsed) {
        await axios.get(`https://zkbridgescan.io/api/scan?txOrAddress=${wallet}&pageStart=0&pageSize=1000`, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            txs = response.data.data
            data.tx_count = response.data.total
            isTxParsed = true
        }).catch(error => {
            if (debug) console.error(wallet, error.toString(), '| Get random proxy')
            retry++

            agent = getProxy(index, true)

            if (retry >= 3) {
                isTxParsed = true
            }
        })
    }
    
    if (txs.length) {
        for (const tx of Object.values(txs)) {
            const date = new Date(timestampToDate(tx.sendTimestamp))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.senderChainId)
            uniqueDestination.add(tx.receiverChainId)
        }

        data.first_tx = new Date(timestampToDate(txs[txs.length - 1].sendTimestamp))
        data.last_tx = new Date(timestampToDate(txs[0].sendTimestamp))
        data.source_chain_count = uniqueSource.size
        data.dest_chain_count = uniqueDestination.size
        data.days = uniqueDays.size
        data.weeks = uniqueWeeks.size
        data.months = uniqueMonths.size
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
        'First TX': data.tx_count ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last TX': data.tx_count ? moment((data.last_tx)).format("DD.MM.YY") : '-',
    }

    jsonData.push({
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'sources': Array.from(uniqueSource),
        'dests': Array.from(uniqueDestination),
        'First TX': data.tx_count ? data.first_tx : '—',
        'Last TX': data.tx_count ? data.last_tx : '—',
    })

    p.addRow(row)

    iteration++
}

async function fetchBatch(batch, isExtended) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), isExtended)))
}

function fetchWallets(isExtended) {
    wallets = readWallets('./addresses/zkbridge.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []

    csvWriter = createObjectCsvWriter({
        path: './results/zkbridge.csv',
        header: headers
    })

    const batchSize = 50
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch, isExtended))
            }, i * 5000)
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

export async function zkbridgeFetchDataAndPrintTable(isExtended = false) {
    progressBar.start(iterations, 0)

    await fetchWallets(isExtended)
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function zkbridgeData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}