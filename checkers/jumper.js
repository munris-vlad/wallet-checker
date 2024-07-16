import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey, generateFormattedString } from '../utils/common.js'
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
    { name: 'Volume', alignment: 'right', color: 'cyan' },
    { name: 'Source chains', alignment: 'right', color: 'cyan' },
    { name: 'Dest chains', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
    { name: 'Fee', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Volume', title: 'Volume' },
    { id: 'Source chains', title: 'Source chains' },
    { id: 'Dest chains', title: 'Dest chains' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
    { id: 'Fee', title: 'Fee' },
]


const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('jumper')
}

let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.jumper.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index, isFetch = false) {
    let agent = getProxy(index, true)

    let data = {
        wallet: wallet,
        tx_count: 0,
        volume: 0,
        source_chain_count: 0,
        source_chain: '',
        dest_chain_count: 0,
        dest_chain: '',
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: '',
        sources: {},
        destinations: {},
        protocols: {},
        fee: 0
    }

    let txs = []
    let isTxParsed = false
    let retry = 0

    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()
    const sources = {}
    const destinations = {}
    const protocols = {}

    const existingData = await getWalletFromDB(wallet, 'jumper')

    if (existingData && !isFetch) {
        data = JSON.parse(existingData)
    } else {
        while (!isTxParsed) {
            await axios.get(`https://li.quest/v1/analytics/transfers?fromTimestamp=0&&wallet=${wallet}`, {
                httpsAgent: agent,
                signal: newAbortSignal(15000)
            }).then(response => {
                txs = response.data.transfers
                data.tx_count = txs.length
                isTxParsed = true
            }).catch(async error => {
                if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
                retry++

                agent = getProxy(index, true)
                await sleep(3000)

                if (retry >= 3) {
                    isTxParsed = true
                }
            })
        }

        if (txs.length) {
            for (const tx of Object.values(txs)) {
                const date = new Date(timestampToDate(tx.sending.timestamp))
                uniqueDays.add(date.toDateString())
                uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
                uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
                uniqueSource.add(tx.sending.chainId)
                uniqueDestination.add(tx.receiving.chainId)
                
                if (tx.tool) {
                    if (!protocols[tx.tool]) {
                        protocols[tx.tool] = 1
                    } else {
                        protocols[tx.tool]++
                    }
                }

                if (!sources[tx.sending.chainId]) {
                    sources[tx.sending.chainId] = 1
                } else {
                    sources[tx.sending.chainId]++
                }

                if (!destinations[tx.receiving.chainId]) {
                    destinations[tx.receiving.chainId] = 1
                } else {
                    destinations[tx.receiving.chainId]++
                }

                data.volume += parseFloat(tx.sending.amountUSD)
                data.fee += tx.sending.gasAmountUSD ? parseFloat(tx.sending.gasAmountUSD) : 0
                data.fee += tx.receiving.gasAmountUSD ? parseFloat(tx.receiving.gasAmountUSD) : 0
            }

            data.first_tx = new Date(timestampToDate(txs[txs.length - 1].sending.timestamp))
            data.last_tx = new Date(timestampToDate(txs[0].sending.timestamp))
            data.source_chain_count = uniqueSource.size
            data.dest_chain_count = uniqueDestination.size
            data.days = uniqueDays.size
            data.weeks = uniqueWeeks.size
            data.months = uniqueMonths.size
            data.sources = sources
            data.destinations = destinations
            data.protocols = protocols
        }
    }

    progressBar.update(iteration)

    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Volume': '$'+data.volume.toFixed(0),
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First tx': data.first_tx ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last tx': data.last_tx ? moment((data.last_tx)).format("DD.MM.YY") : '-',
        'Fee': '$'+data.fee.toFixed(2),
    }

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Volume': data.volume.toFixed(0),
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Contracts': data.contracts,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First tx': data.first_tx,
        'Last tx': data.last_tx,
        'Fee': data.fee.toFixed(2),
    }

    jsonRow['sources'] = sortObjectByKey(data.sources)
    jsonRow['destinations'] = data.destinations
    jsonRow['protocols'] = sortObjectByKey(data.protocols)

    p.addRow(row)
    jsonData.push(jsonRow)

    if (data.tx_count > 0) {
        await saveWalletToDB(wallet, 'jumper', JSON.stringify(data))
    }

    iteration++
}

async function fetchBatch(batch, isExtended) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), isExtended)))
}

async function fetchWallets(isExtended) {
    wallets = readWallets(config.modules.jumper.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/jumper.csv',
        header: headers
    })

    let batchSize = 3
    let timeout = 10000

    const walletsInDB = await getCountByChecker('jumper')

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
                resolve(fetchBatch(batch, isExtended))
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

export async function jumperFetchDataAndPrintTable(isExtended = false) {
    progressBar.start(iterations, 0)
    await fetchWallets(isExtended)
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function jumperData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}

export async function jumperFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), false, true)
}

export async function jumperClean() {
    await cleanByChecker('jumper')
}