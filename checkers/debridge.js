import { getKeyByValue, newAbortSignal, readWallets, timestampToDate, getProxy, getTokenPrice } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"
import { config } from '../_user_data/config.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'Rank', alignment: 'right', color: 'cyan' },
    { name: 'Points', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Volume', alignment: 'right', color: 'cyan' },
    { name: 'Source chains', alignment: 'right', color: 'cyan' },
    { name: 'Dest chains', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First TX', alignment: 'right', color: 'cyan' },
    { name: 'Last TX', alignment: 'right', color: 'cyan' },
    { name: 'Fee', alignment: 'right', color: 'cyan' },
    { name: 'Multiplier', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Points', title: 'Points' },
    { id: 'Rank', title: 'Rank' },
    { id: 'Volume', title: 'Volume' },
    { id: 'Source chains', title: 'Source chains' },
    { id: 'Dest chains', title: 'Dest chains' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First TX', title: 'First TX' },
    { id: 'Last TX', title: 'Last TX' },
    { id: 'Fee', title: 'Fee' },
    { id: 'Multiplier', title: 'Multiplier' },
]



let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.debridge.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let totalPoints = 0
let totalFee = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function getQueryHeaders() {
    return {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
        "content-type": "application/json-patch+json",
        "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referer": "https://app.debridge.finance/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
}

let prices = {
    'ETH': await getTokenPrice('ETH'),
    'BNB': await getTokenPrice('BNB'),
    'USDT': 1,
    'USDC': 1,
}

async function fetchWallet(wallet, index) {
    let agent = getProxy(index)

    let data = {
        wallet: wallet,
        tx_count: 0,
        volume: 0,
        source_chain_count: 0,
        dest_chain_count: 0,
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: '',
        fee: 0,
        points: 0,
        rank: 0,
        multiplier: 1
    }

    let txs = []
    let isTxParsed = false
    let isPointsParse = false
    let retry = 0
    let retryPoints = 0
    let volume = 0
    let fee = 0
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()

    while (!isPointsParse) {
        await axios.get(`https://points-api.debridge.finance/api/Points/${wallet}/summary`, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            data.points = parseFloat(response.data.totalPoints, 0)
            data.rank = response.data.userRank
            data.multiplier = response.data.activeMultiplier
            isPointsParse = true
        }).catch(error => {
            if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
            retryPoints++

            agent = getProxy(index, true)

            if (retryPoints >= 3) {
                isPointsParse = true
            }
        })
    }

    while (!isTxParsed) {
        await axios.post(`https://stats-api.dln.trade/api/Orders/filteredList`, {
            giveChainIds: [],
            takeChainIds: [],
            skip: 0,
            take: 100,
            creator: wallet
        }, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            txs = response.data.orders
            data.tx_count = response.data.orders.length
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
        for (const tx of Object.values(txs)) {
            if (tx.giveOfferWithMetadata) {
                let amount = parseInt(tx.giveOfferWithMetadata.amount.bigIntegerValue) / Math.pow(10, tx.giveOfferWithMetadata.metadata.decimals)
                volume += parseFloat(amount * prices[tx.giveOfferWithMetadata.metadata.symbol])
            }

            if (tx.finalPercentFee) {
                let amount = parseInt(tx.finalPercentFee.bigIntegerValue) / Math.pow(10, 18)
                fee += parseFloat(amount * prices['ETH'])
            }

            if (tx.fixFee) {
                let amount = parseInt(tx.fixFee.bigIntegerValue) / Math.pow(10, 18)
                fee += parseFloat(amount * prices['ETH'])
            }

            const date = new Date(timestampToDate(tx.creationTimestamp))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.giveOfferWithMetadata.chainId.bigIntegerValue)
            uniqueDestination.add(tx.takeOfferWithMetadata.chainId.bigIntegerValue)
        }

        data.first_tx = new Date(timestampToDate(txs[txs.length - 1].creationTimestamp))
        data.last_tx = new Date(timestampToDate(txs[0].creationTimestamp))
        data.source_chain_count = uniqueSource.size
        data.dest_chain_count = uniqueDestination.size
        data.days = uniqueDays.size
        data.weeks = uniqueWeeks.size
        data.months = uniqueMonths.size
        data.volume = parseInt(volume)
        data.fee = parseInt(fee)
    }

    progressBar.update(iteration)

    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Volume': '$'+data.volume,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.tx_count ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last TX': data.tx_count ? moment((data.last_tx)).format("DD.MM.YY") : '-',
        'Fee': '$'+data.fee,
        'Points': parseInt(data.points),
        'Rank': data.rank,
        'Multiplier': data.multiplier,
    }

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Volume': data.volume,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.first_tx,
        'Last TX': data.last_tx,
        'Fee': data.fee,
        'Points': parseInt(data.points),
        'Rank': data.rank,
        'Multiplier': data.multiplier,
    }

    p.addRow(row)
    jsonData.push(jsonRow)
    totalFee += data.fee
    totalPoints += data.points

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

function fetchWallets() {
    wallets = readWallets(config.modules.debridge.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []
    totalPoints = 0
    totalFee = 0

    csvWriter = createObjectCsvWriter({
        path: './results/debridge.csv',
        header: headers
    })

    const batchSize = 30
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
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

async function addTotalRow() {
    p.addRow({
        'Wallet': 'TOTAL',
        'Points': parseInt(totalPoints),
        'Fee': `$${totalFee}`
    })
}

export async function debridgeFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)

    await fetchWallets()
    await addTotalRow()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function debridgeData() {
    await fetchWallets()
    jsonData.push({
        'Wallet': 'Total',
        'Points': parseInt(totalPoints),
        'Fee': `${totalFee}`
    })
    await saveToCsv()

    return jsonData
}