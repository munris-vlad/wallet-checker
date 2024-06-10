import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey, getTokenPrice } from '../utils/common.js'
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
    cleanByChecker('hyperlane')
}

let p
let csvWriter
let wallets = readWallets(config.modules.hyperlane.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index, isFetch = false) {
    let agent = getProxy(0, true)

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

    const existingData = await getWalletFromDB(wallet, 'hyperlane')

    if (existingData && !isFetch) {
        data = JSON.parse(existingData)
    } else {
        while (!isTxParsed) {
            await axios.post('https://explorer4.hasura.app/v1/graphql', {
                variables: {
                    search: "\\x"+wallet.toLowerCase().slice(2),
                },
                query: "query ($search: bytea, $originChains: [bigint!], $destinationChains: [bigint!], $startTime: timestamp, $endTime: timestamp) {\n  q0: message_view(\n    where: {_and: [{sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q1: message_view(\n    where: {_and: [{recipient: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q2: message_view(\n    where: {_and: [{origin_tx_sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q3: message_view(\n    where: {_and: [{destination_tx_sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n}"
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
                if (response.data.data) {
                    txs = Object.values(response.data.data).reduce((acc, currentArray) => acc.concat(currentArray), [])
                }
                isTxParsed = true
            }).catch(async error => {
                if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
                retry++

                agent = getProxy(index, true)

                if (retry >= 3) {
                    isTxParsed = true
                }
                await sleep(10000)
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
            data.uniqueSources = Array.from(uniqueSource)
            data.uniqueDestinations = Array.from(uniqueDestination)
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
        'sources': data.uniqueSources,
        'dests': data.uniqueDestinations,
        'First TX': data.tx_count ? data.first_tx : '—',
        'Last TX': data.tx_count ? data.last_tx : '—',
    })

    p.addRow(row)
    if (data.tx_count > 0) {
        await saveWalletToDB(wallet, 'hyperlane', JSON.stringify(data))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.hyperlane.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/hyperlane.csv',
        header: headers
    })

    let batchSize = 20
    let timeout = 5000

    const walletsInDB = await getCountByChecker('hyperlane')

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

export async function hyperlaneFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function hyperlaneClean() {
    await cleanByChecker('hyperlane')
}