import '../utils/common.js'
import {
    getKeyByValue,
    getProxy,
    newAbortSignal,
    readWallets,
    sleep,
    timestampToDate
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

let protocolsData = [
    {
        name: 'jediswap',
        url: 'https://www.jediswap.xyz/'
    },
    {
        name: '10kswap',
        url: 'https://10kswap.com/'
    },
    {
        name: 'nostra',
        url: 'https://nostra.finance/'
    },
    {
        name: 'avnu',
        url: 'https://www.avnu.fi/'
    },
    {
        name: 'sithswap',
        url: 'https://sithswap.com/'
    },
    {
        name: 'myswap',
        url: 'https://www.myswap.xyz/'
    },
    {
        name: 'fibrous',
        url: 'https://fibrous.finance/'
    },
    {
        name: 'zklend',
        url: 'https://zklend.com/'
    },
]

let columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'ETH', alignment: 'right' },
    { name: 'USDC', alignment: 'right' },
    { name: 'USDT', alignment: 'right' },
    { name: 'DAI', alignment: 'right' },
    { name: 'Volume', alignment: 'right' },
    { name: 'TX Count', alignment: 'right' },
    { name: 'Contracts', alignment: 'right' },
    { name: 'Bridge to / from', alignment: 'right' },
    { name: 'Days', alignment: 'right' },
    { name: 'Weeks', alignment: 'right' },
    { name: 'Months', alignment: 'right' },
    { name: 'Total gas spent', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right' },
    { name: 'Last tx', alignment: 'right' },
]

let headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'ETH', title: 'ETH' },
    { id: 'USDC', title: 'USDC' },
    { id: 'USDT', title: 'USDT' },
    { id: 'DAI', title: 'DAI' },
    { id: 'Volume', title: 'Volume' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Contracts', title: 'Contracts' },
    { id: 'Bridge to / from', title: 'Bridge to / from' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'Total gas spent', title: 'Total gas spent' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

let debug = true
let p
let csvWriter
let stats = []
let jsonData = []
let wallets = readWallets('./addresses/starknet.txt')
let proxies = readWallets('./proxies.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0
}
const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']
const stables = ['USDT', 'USDC', 'DAI']
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
const apiUrl = 'https://voyager.online/api'
const cancelTimeout = 15000

async function getBalances(wallet, index) {
    let config = {
        signal: newAbortSignal(cancelTimeout),
        httpsAgent: getProxy(index)
    }

    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })

    let isBalancesFetched = false
    let retry = 0
    while (!isBalancesFetched) {
        await axios.get(apiUrl + '/contract/' + wallet + '/balances', config).then(async response => {
            let balances = response.data

            if (balances) {
                isBalancesFetched = true
                Object.values(balances).forEach(balance => {
                    if (filterSymbol.includes(balance.symbol)) {
                        stats[wallet].balances[balance.symbol] = balance.formattedBalance
                    }
                })
            }
        }).catch(e => {
            if (debug) console.log('balances', e.toString())

            retry++

            config.agent = getProxy(index, true)

            if (retry >= 5) {
                isBalancesFetched = true
            }
        })
    }
}

async function getTxs(wallet, index) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let totalGasUsed = 0
    let volume = 0
    let txs = []
    let transfers = []
    let bridgeTo = 0
    let bridgeFrom = 0
    let isAllTxCollected = false
    let isAllTransfersCollected = false
    let retry = 0
    let retryTransfers = 0

    let config = {
        signal: newAbortSignal(cancelTimeout),
        httpsAgent: getProxy(index),
        params: {
            to: wallet,
            p: 1,
            ps: 100
        }
    }

    let transferConfig = {
        signal: newAbortSignal(cancelTimeout),
        httpsAgent: getProxy(index),
        params: {
            p: 1,
            ps: 100
        }
    }

    let protocols = {}
    protocolsData.forEach(protocol => {
        protocols[protocol.name] = {}
        protocols[protocol.name].count = 0
        protocols[protocol.name].url = protocol.url
    })

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/txns', config).then(async response => {
            let items = response.data.items
            let lastPage = response.data.lastPage
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (config.params.p === lastPage) {
                isAllTxCollected = true
            } else {
                config.params.p++
            }
        }).catch((e) => {
            if (debug) console.log('txs', e.toString())

            retry++

            config.agent = getProxy(index, true)

            if (retry >= 5) {
                isAllTxCollected = true
            }
        })
    }

    while (!isAllTransfersCollected) {
        await axios.get(apiUrl + '/contract/' + wallet + '/transfers', transferConfig).then(async response => {
            let items = response.data.items
            let lastPage = response.data.lastPage
            Object.values(items).forEach(transfer => {
                transfers.push(transfer)
            })

            if (transferConfig.params.p === lastPage) {
                isAllTransfersCollected = true
            } else {
                transferConfig.params.p++
            }
        }).catch(async (e) => {
            if (debug) console.log('transfers', wallet, e.toString())

            retryTransfers++
            await sleep(2000)

            transferConfig.agent = getProxy(index, true)

            if (retryTransfers >= 5) {
                isAllTransfersCollected = true
            }
        })
    }

    if (txs.length) {
        stats[wallet].txcount = txs.length

        for (const tx of Object.values(txs)) {
            const date = new Date(timestampToDate(tx.timestamp))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            totalGasUsed += parseInt(tx.actual_fee) / Math.pow(10, 18)
        }

        stats[wallet].first_tx_date = new Date(timestampToDate(txs[txs.length - 1].timestamp))
        stats[wallet].last_tx_date = new Date(timestampToDate(txs[0].timestamp))
        stats[wallet].unique_days = uniqueDays.size
        stats[wallet].unique_weeks = uniqueWeeks.size
        stats[wallet].unique_months = uniqueMonths.size
        stats[wallet].total_gas = totalGasUsed
    }

    if (transfers.length) {
        for (const transfer of Object.values(transfers)) {
            if (transfer.from_alias === null && transfer.to_alias !== null) {
                uniqueContracts.add(transfer.transfer_to)
                let protocol = protocolsData.find(protocol => transfer.to_alias.toLowerCase().includes(protocol.name))

                if (protocol) {
                    protocols[protocol.name].count++
                }

                if (transfer.token_symbol === 'ETH') {
                    volume += parseFloat(transfer.transfer_value) * ethPrice
                }

                if (stables.includes(transfer.token_symbol)) {
                    volume += parseFloat(transfer.transfer_value)
                }
            }

            if (transfer.transfer_from === '0x0000000000000000000000000000000000000000000000000000000000000000'
                && transfer.call_name === 'permissionedMint') {
                bridgeTo++
            }

            if (transfer.transfer_from === '0x0000000000000000000000000000000000000000000000000000000000000000'
                && transfer.call_name === 'permissionedBurn') {
                bridgeFrom++
            }
        }

        stats[wallet].unique_contracts = uniqueContracts.size
        stats[wallet].volume = volume
        stats[wallet].bridge_to = bridgeTo
        stats[wallet].bridge_from = bridgeFrom
        stats[wallet].protocols = protocols
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balances: [],
        volume: 0
    }

    let proxy = null
    if (proxies.length) {
        if (proxies[index]) {
            proxy = proxies[index]
        } else {
            proxy = proxies[0]
        }
    }

    await getBalances(wallet, index)
    await getTxs(wallet, index)
    progressBar.update(iteration)

    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])

    let usdEthValue = (stats[wallet].balances['ETH'] * ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas * ethPrice).toFixed(2)
    let row

    row = {
        n: parseInt(index) + 1,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount ?? 0,
        'Volume': stats[wallet].volume ? '$' + stats[wallet].volume?.toFixed(2) : '$' + 0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to / from': `${stats[wallet].bridge_to} / ${stats[wallet].bridge_from}`,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '—',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '—',
    }

    if (stats[wallet].total_gas > 0) {
        row['Total gas spent'] = stats[wallet].total_gas.toFixed(4) + ` ($${usdGasValue})`
    }

    if (stats[wallet].txcount) {
        p.addRow(row, { color: "cyan" })
    } else {
        p.addRow(row, { color: "red" })
    }

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount ?? 0,
        'Volume': stats[wallet].volume ? stats[wallet].volume?.toFixed(2) : 0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to': stats[wallet].bridge_to,
        'Bridge from': stats[wallet].bridge_from,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': stats[wallet].total_gas ? usdGasValue : 0,
        'Protocols': stats[wallet].protocols
    })

    iteration++
}

async function fetchWallets() {
    wallets = readWallets('./addresses/starknet.txt')
    proxies = readWallets('./proxies.txt')
    iterations = wallets.length
    iteration = 1
    jsonData = []
    csvData = []

    let batchSize = 3
    let timeout = 11000

    if (proxies.length) {
        batchSize = 10
        timeout = 1000
    }

    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    total = {
        eth: 0,
        usdc: 0,
        usdt: 0,
        dai: 0,
        gas: 0,
        lite_eth: 0
    }

    csvData = []
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    csvWriter = createObjectCsvWriter({
        path: './results/starknet.csv',
        header: headers
    })

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

    await Promise.all(walletPromises)


    return true
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
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

    let row = {
        wallet: 'Total',
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth * ethPrice).toFixed(2)})`,
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'TX Count': '',
        'Days': '',
        'Weeks': '',
        'Months': '',
        'First tx': '',
        'Last tx': '',
    }

    if (total.gas > 0) {
        row['Total gas spent'] = total.gas.toFixed(4) + ` ($${(total.gas * ethPrice).toFixed(2)})`
    }

    p.addRow(row, { color: "cyan" })
}

export async function starknetFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function starknetData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'ETH': total.eth.toFixed(4),
        'ETH USDVALUE': (total.eth * ethPrice).toFixed(2),
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'TX Count': '',
        'Days': '',
        'Weeks': '',
        'Months': '',
        'First tx': '',
        'Last tx': '',
        'Total gas spent': total.gas > 0 ? total.gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': total.gas > 0 ? (total.gas * ethPrice).toFixed(2) : 0
    })

    return jsonData
}