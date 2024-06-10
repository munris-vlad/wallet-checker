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
    { name: 'Clusters', color: 'green', alignment: "right" },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Bad protocols %', alignment: 'right', color: 'cyan' },
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
    { id: 'Bad protocols %', title: 'Bad protocols %' },
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

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('layerzero')
}

let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.layerzero.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)


function getQueryHeaders(wallet) {
    return {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
        "content-type": "application/json",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": `https://layerzeroscan.com/address/${wallet}`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Sentry-Trace": generateFormattedString(),
        "Cookie": ""
    }
}

async function fetchWallet(wallet, index, isExtended, isFetch = false) {

    let agent = getProxy(index, true)

    let data = {
        wallet: wallet,
        clusters: '',
        tx_count: 0,
        source_chain_count: 0,
        source_chain: '',
        dest_chain_count: 0,
        dest_chain: '',
        contracts: 0,
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: '',
        badProtocolsCount: 0,
        sources: {},
        destinations: {},
        protocols: {},
    }

    let txs = []
    let isTxParsed = false
    let isClustersParsed = false
    let retry = 0
    let retryClusters = 0
    let badProtocols = ['merkly', 'zerius', 'gas.zip', 'l2telegraph', 'l2pass', 'l2marathon', 'nogem']
    let badProtocolsCount = 0

    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()
    const sources = {}
    const destinations = {}
    const protocols = {}

    const existingData = await getWalletFromDB(wallet, 'layerzero')

    if (existingData && !isFetch) {
        data = JSON.parse(existingData)
    } else {
        while (!isTxParsed) {
            await axios.get(`https://layerzeroscan.com/api/trpc/messages.list?input=${encodeURIComponent(`{"filters":{"address":"${wallet}","stage":"mainnet","created":{}}}`)}`, {
                headers: getQueryHeaders(wallet),
                httpsAgent: agent,
                signal: newAbortSignal(15000)
            }).then(response => {
                txs = response.data.result.data.messages
                data.tx_count = response.data.result.data.count
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

        while (!isClustersParsed) {
            await axios.post(`https://api.clusters.xyz/v0.1/name/addresses`, [wallet.toLowerCase()], {
                headers: getQueryHeaders(),
                httpsAgent: agent,
                signal: newAbortSignal(15000)
            }).then(response => {
                data.clusters = response.data[0].name ? response.data[0].name.replace('/main', '') : ''
                isClustersParsed = true
            }).catch(async error => {
                if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
                retryClusters++

                agent = getProxy(index, true)
                await sleep(2000)
                if (retryClusters >= 3) {
                    isClustersParsed = true
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

                    if (badProtocols.includes(tx.srcUaProtocol.id)) {
                        badProtocolsCount++
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
            data.badProtocolsCount = badProtocolsCount
            data.sources = sources
            data.destinations = destinations
            data.protocols = protocols
        }
    }

    progressBar.update(iteration)
    
    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Clusters: data.clusters,
        'TX Count': data.tx_count,
        'Bad protocols %': ((data.badProtocolsCount / data.tx_count) * 100).toFixed(0) + '%',
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
        'Bad protocols %': ((data.badProtocolsCount / data.tx_count) * 100).toFixed(0),
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
        Object.entries(data.protocols).forEach(([protocol, count]) => {
            if (protocol === 'harmony') {
                row[protocol+'-bridge'] = count
            } else {
                row[protocol] = count
            }
        })
    }

    jsonRow['sources'] = sortObjectByKey(data.sources)
    jsonRow['destinations'] = data.destinations
    jsonRow['protocols'] = sortObjectByKey(data.protocols)

    p.addRow(row)
    jsonData.push(jsonRow)

    if (data.tx_count > 0) {
        await saveWalletToDB(wallet, 'layerzero', JSON.stringify(data))
    }

    iteration++
}

async function fetchBatch(batch, isExtended) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), isExtended)))
}

async function fetchWallets(isExtended) {
    wallets = readWallets(config.modules.layerzero.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/layerzero.csv',
        header: headers
    })

    let batchSize = 10
    let timeout = 3000

    const walletsInDB = await getCountByChecker('layerzero')

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

export async function layerzeroFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), false, true)
}

export async function layerzeroClean() {
    await cleanByChecker('layerzero')
}