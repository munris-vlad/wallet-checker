import '../utils/common.js'
import {
    getKeyByValue,
    readWallets,
    sleep,
    starknetApiUrl, starknetBalanceQuery,
    starknetHeaders, starknetTransfersQuery, starknetTxQuery, timestampToDate,
} from '../utils/common.js'
import axios from "axios"
import {Table} from 'console-table-printer'
import {createObjectCsvWriter} from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import {HttpProxyAgent} from "http-proxy-agent"
import {SocksProxyAgent} from "socks-proxy-agent"

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

let protocolsData = [
    {
        address: '0x03090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c',
        name: 'aspect',
        url: 'https://aspect.co/'
    },
    {
        address: '0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af',
        name: 'starknetid',
        url: 'https://app.starknet.id/'
    },
    {
        address: '0x6ac597f8116f886fa1c97a23fa4e08299975ecaf6b598873ca6792b9bbfb678',
        name: 'starknetid',
        url: 'https://app.starknet.id/'
    },
    {
        address: '0x04942ebdc9fc996a42adb4a825e9070737fe68cef32a64a616ba5528d457812e',
        name: 'starknetid',
        url: 'https://app.starknet.id/'
    },
    {
        address: '0x04942ebdc9fc996a42adb4a825e9070737fe68cef32a64a616ba5528d457812e',
        name: 'mintsquare',
        url: 'https://mintsquare.io/'
    },
    {
        address: '0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023',
        name: 'jediswap',
        url: 'https://www.jediswap.xyz/'
    },
    {
        address: '0x07a6f98c03379b9513ca84cca1373ff452a7462a3b61598f0af5bb27ad7f76d1',
        name: '10kswap',
        url: 'https://10kswap.com/'
    },
    {
        address: '0x070f8a4fcd75190661ca09a7300b7c93fab93971b67ea712c664d7948a8a54c6',
        name: 'nostra',
        url: 'https://nostra.finance/'
    },
    {
        address: '0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f',
        name: 'avnu',
        url: 'https://www.avnu.fi/'
    },
    {
        address: '0x028c858a586fa12123a1ccb337a0a3b369281f91ea00544d0c086524b759f627',
        name: 'sithswap',
        url: 'https://sithswap.com/'
    },
    {
        address: '0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28',
        name: 'myswap',
        url: 'https://www.myswap.xyz/'
    },
    {
        address: '0x01b23ed400b210766111ba5b1e63e33922c6ba0c45e6ad56ce112e5f4c578e62',
        name: 'fibrous.finance',
        url: 'https://fibrous.finance/'
    },
    {
        address: '0x03201e8057a781dca378564b9d3bbe9b5b7617fac4ad9d9deaa1024cf63f877e',
        name: 'fibrous.finance',
        url: 'https://fibrous.finance/'
    },
    {
        address: '0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05',
        name: 'zklend',
        url: 'https://zklend.com/'
    },
    {
        address: '0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309',
        name: 'dmail',
        url: 'https://dmail.ai/'
    },
]

let columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right'},
    { name: 'USDC', alignment: 'right'},
    { name: 'USDT', alignment: 'right'},
    { name: 'DAI', alignment: 'right'},
    { name: 'Volume', alignment: 'right'},
    { name: 'TX Count', alignment: 'right'},
    { name: 'Contracts', alignment: 'right'},
    { name: 'Bridge to / from', alignment: 'right'},
    { name: 'Days', alignment: 'right'},
    { name: 'Weeks', alignment: 'right'},
    { name: 'Months', alignment: 'right'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right'},
    { name: 'Last tx', alignment: 'right'},
]

let headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
    { id: 'USDT', title: 'USDT'},
    { id: 'DAI', title: 'DAI'},
    { id: 'Volume', title: 'Volume'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Contracts', title: 'Contracts'},
    { id: 'Bridge to / from', title: 'Bridge to / from'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'Total gas spent', title: 'Total gas spent'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
]

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

const contracts = [
    {
        name: 'ETH',
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        decimals: 18
    },
    {
        name: 'wstETH',
        address: '0x042b8f0484674ca266ac5d08e4ac6a3fe65bd3129795def2dca5c34ecc5f96d2',
        decimals: 18
    },
    {
        name: 'ETH bridge',
        address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        decimals: 18
    },
    {
        name: 'DAI',
        address: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
        decimals: 18
    },
    {
        name: 'USDC',
        address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
        decimals: 6
    },
    {
        name: 'USDT',
        address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
        decimals: 6
    }
]

async function getBalances(wallet, proxy = null) {
    let config = {}
    if (proxy) {
        if (proxy.includes('http')) {
            config.httpAgent = new HttpProxyAgent(proxy)
        }

        if (proxy.includes('socks')) {
            config.httpAgent = new SocksProxyAgent(proxy)
        }
    }

    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })

    let isBalancesFetched = false
    while (!isBalancesFetched) {
        await axios.get(apiUrl+'/contract/' + wallet + '/balances', config).then(async response => {
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
            console.log(e.toString())
        })
    }
}

async function getTxs(wallet, proxy = null) {
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

    let config = {
        params: {
            to: wallet,
            p: 1,
            ps: 100
        }
    }

    let transferConfig = {
        params: {
            p: 1,
            ps: 100
        }
    }

    if (proxy) {
        if (proxy.includes('http')) {
            config.httpAgent = new HttpProxyAgent(proxy)
            transferConfig.httpAgent = new HttpProxyAgent(proxy)
        }

        if (proxy.includes('socks')) {
            config.httpAgent = new SocksProxyAgent(proxy)
            transferConfig.httpAgent = new SocksProxyAgent(proxy)
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
            console.log(e.toString())
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
        }).catch((e) => {
            console.log(e.toString())
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
            uniqueContracts.add(transfer.transfer_to)
            let protocol = protocolsData.find(protocol => protocol.address.toLowerCase() === transfer.transfer_to.toLowerCase())

            if (protocol) {
                protocols[protocol.name].count++
            }

            if (transfer.token_symbol === 'ETH') {
                volume += parseFloat(transfer.transfer_value) * ethPrice
            }

            if (stables.includes(transfer.token_symbol)) {
                volume += parseFloat(transfer.transfer_value)
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
    if (proxies.length && proxies[index]) {
        proxy = proxies[index]
    }

    await getBalances(wallet, proxy)
    await getTxs(wallet, proxy)
    progressBar.update(iteration)

    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])

    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let row

    row = {
        n: parseInt(index)+1,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount ?? 0,
        'Volume': stats[wallet].volume ? '$'+stats[wallet].volume?.toFixed(2) : '$'+0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to / from': `${stats[wallet].bridge_to} / ${stats[wallet].bridge_from}`,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '—',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '—',
    }

    if (stats[wallet].total_gas > 0) {
        row['Total gas spent'] = stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})`
    }

    if (stats[wallet].txcount) {
        p.addRow(row, { color: "cyan" })
    } else {
        p.addRow(row, { color: "red" })
    }

    jsonData.push({
        n: parseInt(index)+1,
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
    let timeout = 10000

    if (wallets.length === proxies.length) {
        batchSize = 50
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
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
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
        row['Total gas spent'] = total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
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
        'ETH USDVALUE': (total.eth*ethPrice).toFixed(2),
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
        'Total gas spent USDVALUE': total.gas > 0 ? (total.gas*ethPrice).toFixed(2) : 0
    })

    return jsonData
}