import '../utils/common.js'
import {
    getKeyByValue,
    newAbortSignal,
    readWallets,
    sleep,
    timestampToDate,
    random,
    getProxy,
    sortObjectByKey,
    getTokenPrice,
    saveData
} from '../utils/common.js'
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
let wallets = readWallets('./addresses/hyperlane.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let totalPoints = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index) {
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
        await axios.post('https://explorer4.hasura.app/v1/graphql', {
            variables: {
                search: "\\x"+wallet.toLowerCase().slice(2),
            },
            query: 'query ($search: bytea, $originChains: [bigint!], $destinationChains: [bigint!], $startTime: timestamp, $endTime: timestamp) {\n  message_view(\n    where: {_and: [{_or: [{msg_id: {_eq: $search}}, {sender: {_eq: $search}}, {recipient: {_eq: $search}}, {origin_tx_hash: {_eq: $search}}, {origin_tx_sender: {_eq: $search}}]}]}\n    order_by: {send_occurred_at: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n}',
        }, {
            httpsAgent: agent,
            headers: {
                "accept": "application/graphql+json, application/json",
                "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "Referer": "https://explorer.hyperlane.xyz/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        }).then(response => {
            txs = response.data.data.message_view
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
            const date = new Date(tx.send_occurred_at)
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.origin_chain_id)
            uniqueDestination.add(tx.destination_chain_id)
        }

        data.tx_count = txs.length
        data.first_tx = new Date(txs[txs.length - 1].send_occurred_at)
        data.last_tx = new Date(txs[0].send_occurred_at)
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
    totalPoints += data.galxepoints

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

function fetchWallets() {
    wallets = readWallets('./addresses/hyperlane.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/hyperlane.csv',
        header: headers
    })

    const batchSize = 5
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
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
    await saveData('hyperlane', columns, jsonData)
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function hyperlaneFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)

    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function hyperlaneData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}
