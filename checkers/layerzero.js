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
    { name: 'Clusters', color: 'green', alignment: "right" },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Volume', alignment: 'right', color: 'cyan' },
    { name: 'Source chains', alignment: 'right', color: 'cyan' },
    { name: 'Dest chains', alignment: 'right', color: 'cyan' },
    { name: 'Contracts', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'Clusters', title: 'Clusters' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Volume', title: 'Volume' },
    { id: 'Source chains', title: 'Source chains' },
    { id: 'Dest chains', title: 'Dest chains' },
    { id: 'Contracts', title: 'Contracts' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

const sourceNetworks = [
    'ethereum',
    'bsc',
    'polygon',
    'base',
    'optimism',
    'arbitrum',
    'avalanche',
    'zksync',
    'fantom',
    'coredao',
    'gnosis',
    'klaytn',
    'harmony',
    'celo',
    'moonriver',
    'moonbeam',
    'dfk'
]

const protocolsList = [
    'stargate',
    'aptos-bridge',
    'btc.b',
    'coredao',
    'harmony',
    'testnet-bridge',
    'merkly',
    'zerius',
    'l2pass',
    'l2telegraph',
    'whale',
]

let debug = false
let jsonData = []
let p
let csvWriter
let wallets = readWallets('./addresses/layerzero.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function getQueryHeaders(wallet) {
    return {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,ru;q=0.8,bg;q=0.7',
        'baggage': 'sentry-environment=vercel-production,sentry-release=8b2b3e1a5f4040e5282f0c75f86e8efb01d3fd33,sentry-public_key=7ea9fec73d6d676df2ec73f61f6d88f0,sentry-trace_id=9120fe8b7ed94428851697ab60657409',
        'content-type': 'application/json',
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sentry-trace': '9120fe8b7ed94428851697ab60657409-b26417f0ca88871e-1',
        'cookie': '_ga=GA1.1.520004272.1700156268; _clck=cbqpar|2|fgr|0|1415; _clsk=1fu326x|1700157520972|18|1|t.clarity.ms/collect; _ga_1ZKFRJ8ERQ=GS1.1.1700156267.1.1.1700157521.0.0.0; _ga_3LWZVPQJTS=GS1.1.1700156268.1.1.1700157521.0.0.0',
        'Referer': `https://layerzeroscan.com/address/${wallet}`,
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
}

async function fetchWallet(wallet, index, isExtended) {

    let agent = getProxy(index)

    let data = {
        wallet: wallet,
        clusters: '',
        tx_count: 0,
        volume: 0,
        source_chain_count: 0,
        source_chain: '',
        dest_chain_count: 0,
        dest_chain: '',
        contracts: 0,
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: ''
    }

    let txs = []
    let isTxParsed = false
    let isClustersParsed = false
    let isCopilotParsed = false
    let retry = 0
    let retryClusters = 0
    let retryCopilot = 0

    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()
    const sources = {}
    const destinations = {}
    const protocols = {}

    while (!isTxParsed) {
        await axios.get(`https://layerzeroscan.com/api/trpc/messages.list?input=${encodeURIComponent(`{"filters":{"address":"${wallet}","stage":"mainnet","created":{}}}`)}`, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            txs = response.data.result.data.messages
            data.tx_count = response.data.result.data.count
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

    while (!isClustersParsed) {
        await axios.post(`https://api.clusters.xyz/v0.1/name/addresses`, [wallet], {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(15000)
        }).then(response => {
            data.clusters = response.data[0].name ? response.data[0].name.replace('/main', '') : ''
            isClustersParsed = true
        }).catch(async error => {
            if (debug) console.error(wallet, error.toString(), '| Get random proxy')
            retryClusters++

            agent = getProxy(index, true)
            await sleep(2000)
            if (retryClusters >= 3) {
                isClustersParsed = true
            }
        })
    }

    while (!isCopilotParsed) {
        await axios.post(`https://nftcopilot.com/p-api/layer-zero-rank/check`, {
            address: wallet,
            c: 'check',
            addresses: [wallet]
        }, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            data.volume = parseInt(response.data[0].volume)
            isCopilotParsed = true
        }).catch(error => {
            if (debug) console.error(wallet, error.toString(), '| Get random proxy')
            retryCopilot++

            agent = getProxy(index, true)

            if (retryCopilot >= 3) {
                isCopilotParsed = true
            }
        })
    }
    
    if (txs.length) {
        for (const tx of Object.values(txs)) {
            const date = new Date(timestampToDate(tx.created))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.srcChainKey)
            uniqueDestination.add(tx.dstChainKey)
            uniqueContracts.add(tx.dstUaAddress)
            
            if (tx.srcUaProtocol) {
                if (!protocols[tx.srcUaProtocol.id]) {
                    protocols[tx.srcUaProtocol.id] = 1
                } else {
                    protocols[tx.srcUaProtocol.id]++
                }
            }

            if (!sources[tx.srcChainKey]) {
                sources[tx.srcChainKey] = 1
            } else {
                sources[tx.srcChainKey]++
            }

            if (!destinations[tx.dstChainKey]) {
                destinations[tx.dstChainKey] = 1
            } else {
                destinations[tx.dstChainKey]++
            }
        }

        data.first_tx = new Date(timestampToDate(txs[txs.length - 1].created))
        data.last_tx = new Date(timestampToDate(txs[0].created))
        data.source_chain_count = uniqueSource.size
        data.dest_chain_count = uniqueDestination.size
        data.contracts = uniqueContracts.size
        data.days = uniqueDays.size
        data.weeks = uniqueWeeks.size
        data.months = uniqueMonths.size
    }

    progressBar.update(iteration)
    
    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Clusters: data.clusters,
        'TX Count': data.tx_count,
        'Volume': '$'+data.volume,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Contracts': data.contracts,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First tx': data.first_tx ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last tx': data.last_tx ? moment((data.last_tx)).format("DD.MM.YY") : '-',
    }

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Clusters: data.clusters,
        'TX Count': data.tx_count,
        'Volume': data.volume,
        'Source chains': data.source_chain_count,
        'Dest chains': data.dest_chain_count,
        'Contracts': data.contracts,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First tx': data.first_tx,
        'Last tx': data.last_tx,
    }

    if (isExtended) {
        sourceNetworks.forEach((source) => {
            row[source] = 0
        })
        Object.entries(sources).forEach(([source, count]) => {
            row[source] = count
        })

        protocolsList.forEach((protocol) => {
            if (protocol === 'harmony') {
                row[protocol+'-bridge'] = 0
            } else {
                row[protocol] = 0
            }
        })
        Object.entries(protocols).forEach(([protocol, count]) => {
            if (protocol === 'harmony') {
                row[protocol+'-bridge'] = count
            } else {
                row[protocol] = count
            }
        })
    }

    jsonRow['sources'] = sortObjectByKey(sources)
    jsonRow['destinations'] = destinations
    jsonRow['protocols'] = sortObjectByKey(protocols)

    p.addRow(row)
    jsonData.push(jsonRow)

    iteration++
}

async function fetchBatch(batch, isExtended) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), isExtended)))
}

function fetchWallets(isExtended) {
    wallets = readWallets('./addresses/layerzero.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/layerzero.csv',
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

export async function layerzeroFetchDataAndPrintTable(isExtended = false) {
    progressBar.start(iterations, 0)
    if (isExtended) {
        if (isExtended) {
            sourceNetworks.forEach((source) => {
                headers.push({ id: source, title: source })
                columns.push({ name: source, alignment: 'right', color: 'cyan' })
            })
            protocolsList.forEach((protocol) => {
                if (protocol === 'harmony') {
                    headers.push({ id: protocol+'-bridge', title: protocol+'-bridge' })
                    columns.push({ name: protocol+'-bridge', alignment: 'right', color: 'cyan' })
                } else {
                    headers.push({ id: protocol, title: protocol })
                    columns.push({ name: protocol, alignment: 'right', color: 'cyan' })
                }
            })
        }
    }
    await fetchWallets(isExtended)
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function layerzeroData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}