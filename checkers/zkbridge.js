import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey, getTokenPrice } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'GalxePoints', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Msg tx count', alignment: 'right', color: 'cyan' },
    { name: 'NFT tx count', alignment: 'right', color: 'cyan' },
    { name: 'Token tx count', alignment: 'right', color: 'cyan' },
    { name: 'Volume', alignment: 'right', color: 'cyan' },
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
    { id: 'GalxePoints', title: 'GalxePoints' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Msg tx count', title: 'Msg tx count' },
    { id: 'NFT tx count', title: 'NFT tx count' },
    { id: 'Token tx count', title: 'Token tx count' },
    { id: 'Volume', title: 'Volume' },
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
let totalPoints = 0
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

let prices = {
    'ETH': await getTokenPrice('ETH'),
    'BNB': await getTokenPrice('BNB'),
    'USDT': await getTokenPrice('USDT'),
}

async function fetchWallet(wallet, index, isExtended) {

    let agent = getProxy(index)

    let data = {
        wallet: wallet,
        galxepoints: 0,
        tx_count: 0,
        msg_count: 0,
        nft_count: 0,
        token_count: 0,
        volume: 0,
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
    let volume = 0
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()

    await axios.post('https://graphigo.prd.galaxy.eco/query', {
        operationName: 'SpaceAccessQuery',
        variables: {
            alias: 'polyhedra',
            address: wallet.toLowerCase(),
        },
        query: 'query SpaceAccessQuery($id: Int, $alias: String, $address: String!) {\n  space(id: $id, alias: $alias) {\n    id\n    isFollowing\n    discordGuildID\n    discordGuildInfo\n    status\n    isAdmin(address: $address)\n    unclaimedBackfillLoyaltyPoints(address: $address)\n    addressLoyaltyPoints(address: $address) {\n      id\n      points\n      rank\n      __typename\n    }\n    __typename\n  }\n}\n',
    }, {
        httpsAgent: agent,
        headers: {
            'authority': 'graphigo.prd.galaxy.eco',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://galxe.com',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
    }).then(response => {
       data.galxepoints = response.data.data.space ? response.data.data.space.addressLoyaltyPoints.points : 0
    }).catch(error => {
        if (debug) console.log(error.toString())
    })

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
            if (tx.extra.erc20) {
                let amount = parseInt(tx.extra.erc20.amount) / Math.pow(10, 18)
                volume += parseFloat(amount*prices[tx.extra.erc20.symbol])
            }
            const date = new Date(timestampToDate(tx.sendTimestamp))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.senderChainId)
            uniqueDestination.add(tx.receiverChainId)
        }

        data.first_tx = new Date(timestampToDate(txs[txs.length - 1].sendTimestamp))
        data.last_tx = new Date(timestampToDate(txs[0].sendTimestamp))
        data.msg_count = txs.filter(tx => tx.txType === 'Msg').length
        data.nft_count = txs.filter(tx => tx.txType === 'Nft').length
        data.token_count = txs.filter(tx => tx.txType === 'Erc20Lightning').length
        data.source_chain_count = uniqueSource.size
        data.dest_chain_count = uniqueDestination.size
        data.days = uniqueDays.size
        data.weeks = uniqueWeeks.size
        data.months = uniqueMonths.size
        data.volume = parseInt(volume)
    }

    progressBar.update(iteration)
    
    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'GalxePoints': data.galxepoints,
        'TX Count': data.tx_count,
        'Msg tx count': data.msg_count,
        'NFT tx count': data.nft_count,
        'Token tx count': data.token_count,
        'Volume': data.volume,
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
        'GalxePoints': data.galxepoints,
        'TX Count': data.tx_count,
        'Msg tx count': data.msg_count,
        'NFT tx count': data.nft_count,
        'Token tx count': data.token_count,
        'Volume': data.volume,
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

async function fetchBatch(batch, isExtended) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), isExtended)))
}

function fetchWallets(isExtended) {
    wallets = readWallets('./addresses/zkbridge.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/zkbridge.csv',
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

    p.addRow({
        Wallet: 'Total',
        'GalxePoints': totalPoints,
    })

    jsonData.push({
        Wallet: 'Total',
        'GalxePoints': totalPoints,
    })

    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function zkbridgeData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}