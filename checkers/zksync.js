import '../utils/common.js'
import {
    sleep,
    readWallets,
    getBalance, getKeyByValue,
    newAbortSignal,
    getTokenPrice
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

let headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
    { id: 'USDT', title: 'USDT'},
    { id: 'DAI', title: 'DAI'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Volume', title: 'Volume'},
    { id: 'Contracts', title: 'Contracts'},
    { id: 'Bridge to / from', title: 'Bridge to / from'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
    { id: 'Total gas spent', title: 'Total gas spent'},

]

let columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
    { name: 'USDT', alignment: 'right', color: 'cyan'},
    { name: 'DAI', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Volume', alignment: 'right', color: 'cyan'},
    { name: 'Contracts', alignment: 'right', color: 'cyan'},
    { name: 'Bridge to / from', alignment: 'right'},
    { name: 'Days', alignment: 'right', color: 'cyan'},
    { name: 'Weeks', alignment: 'right', color: 'cyan'},
    { name: 'Months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'}
]

let contracts = [
    {
        address: '0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb',
        name: 'syncswap',
        url: 'https://syncswap.xyz/'
    },
    {
        address: '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295',
        name: 'syncswap',
        url: 'https://syncswap.xyz/'
    },
    {
        address: '0x80115c708e12edd42e504c1cd52aea96c547c05c',
        name: 'syncswap',
        url: 'https://syncswap.xyz/'
    },
    {
        address: '0x8B791913eB07C32779a16750e3868aA8495F5964',
        name: 'mute',
        url: 'https://mute.io/'
    },
    {
        address: '0xDFAaB828f5F515E104BaaBa4d8D554DA9096f0e4',
        name: 'mute',
        url: 'https://mute.io/'
    },
    {
        address: '0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d',
        name: 'spacefi',
        url: 'https://swap-zksync.spacefi.io/'
    },
    {
        address: '0x39E098A153Ad69834a9Dac32f0FCa92066aD03f4',
        name: 'maverick',
        url: 'https://mav.xyz/'
    },
    {
        address: '0x9606eC131EeC0F84c95D82c9a63959F2331cF2aC',
        name: 'izumi',
        url: 'https://zksync.izumi.finance/'
    },
    {
        address: '0xA269031037B4D5fa3F771c401D19E57def6Cb491',
        name: 'odos',
        url: 'https://odos.xyz/'
    },
    {
        address: '0x4bba932e9792a2b917d47830c93a9bc79320e4f7',
        name: 'odos',
        url: 'https://odos.xyz/'
    },
    {
        address: '0xd999E16e68476bC749A28FC14a0c3b6d7073F50c',
        name: 'velocore',
        url: 'https://velocore.xyz/'
    },
    {
        address: '0xF29Eb540eEba673f8Fb6131a7C7403C8e4C3f143',
        name: 'velocore',
        url: 'https://velocore.xyz/'
    },
    {
        address: '0x80C67432656d59144cEFf962E8fAF8926599bCF8',
        name: 'orbiter',
        url: 'https://www.orbiter.finance/'
    },
    {
        address: '0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8',
        name: 'orbiter',
        url: 'https://www.orbiter.finance/'
    },
    {
        address: '0xf8b59f3c3Ab33200ec80a8A58b2aA5F5D2a8944C',
        name: 'pancake',
        url: 'https://pancakeswap.finance/'
    },
    {
        address: '0x8b5193BCaE3032766bEc9d07ecDB9E56aefBff0F',
        name: 'zkname',
        url: 'https://zkns.domains/'
    },
    {
        address: '0x981F198286E40F9979274E0876636E9144B8FB8E',
        name: 'dmail',
        url: 'https://dmail.ai/'
    },
    {
        address: '0xfd505702b37Ae9b626952Eb2DD736d9045876417',
        name: 'woofi',
        url: 'https://fi.woo.org/'
    },
    {
        address: '0x30E63157bD0bA74C814B786F6eA2ed9549507b46',
        name: 'woofi',
        url: 'https://fi.woo.org/'
    },
    {
        address: '0x7ee459d7fde8b4a3c22b9c8c7aa52abaddd9ffd5',
        name: 'bungee',
        url: 'https://www.bungee.exchange/'
    },
    {
        address: '0x22d8b71599e14f20a49a397b88c1c878c86f5579',
        name: 'eralend',
        url: 'https://www.eralend.com/'
    },
    {
        address: '0xc955d5fa053d88e7338317cc6589635cd5b2cf09',
        name: 'eralend',
        url: 'https://www.eralend.com/'
    },
    {
        address: '0x1e8F1099a3fe6D2c1A960528394F4fEB8f8A288D',
        name: 'basilisk',
        url: 'https://basilisk.org/'
    },
    {
        address: '0x4085f99720e699106bc483dab6caed171eda8d15',
        name: 'basilisk',
        url: 'https://basilisk.org/'
    },
    {
        address: '0x50b2b7092bcc15fbb8ac74fe9796cf24602897ad',
        name: 'tevaera',
        url: 'https://tevaera.com/'
    },
    {
        address: '0x1Ecd053f681a51E37087719653f3f0FFe54750C0',
        name: 'omnisea',
        url: 'https://omnisea.xyz/'
    },
    {
        address: '0x7dA50bD0fb3C2E868069d9271A2aeb7eD943c2D6',
        name: 'zerius',
        url: 'http://zerius.io/'
    }
]

const args = process.argv.slice(2)

if (!args.includes('no-lite')) {
    headers.push({ id: 'Lite ETH', title: 'Lite ETH'})
    headers.push({ id: 'Lite TX', title: 'Lite TX'})
    headers.push({ id: 'Lite last TX', title: 'Lite last TX'})
    columns.push({ name: 'Lite ETH', alignment: 'right', color: 'cyan'})
    columns.push({ name: 'Lite TX', alignment: 'right', color: 'cyan'})
    columns.push({ name: 'Lite last TX', alignment: 'right', color: 'cyan'})
}


const apiUrl = "https://block-explorer-api.mainnet.zksync.io"

let ethPrice = await getTokenPrice('ETH')

let p
let csvWriter
let stats = []
let jsonData = []
let wallets = readWallets('./addresses/zksync.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0,
    lite_eth: 0
}

const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']
const filterSymbolAddress = ['0x000000000000000000000000000000000000800A', '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', '0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656']
const stableSymbol = ['USDT', 'USDC', 'BUSD', 'DAI', 'ZKUSD', 'CEBUSD', 'LUSD', 'USD+', 'ibETH', 'WETH', 'ibUSDC', 'ETH']
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function getBalances(wallet) {
    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })
    await axios.get(apiUrl+'/address/'+wallet, {
        signal: newAbortSignal(5000)
    }).then(response => {
        let balances = response.data.balances

        Object.values(balances).forEach(balance => {
            if (balance.token) {
                if (filterSymbolAddress.includes(balance.token.l2Address)) {
                    stats[wallet].balances[balance.token.symbol] = getBalance(balance.balance, balance.token.decimals)
                }
            }
        })
    }).catch(function (error) {
        console.log(`${wallet}: ${error}`)
    })
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let protocols = {}
    contracts.forEach(contract => {
        protocols[contract.name] = {}
        protocols[contract.name].count = 0
        protocols[contract.name].url = contract.url
    })

    let totalGasUsed = 0
    let totalValue = 0
    let bridgeTo = 0
    let bridgeFrom = 0
    let txs = []
    let page = 1
    let isAllTxCollected = false
    let retry = 0

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/transactions', {
            signal: newAbortSignal(5000),
            params: {
                address: wallet,
                limit: 100,
                page: page
            }
        }).then(response => {
            let items = response.data.items
            let meta = response.data.meta
            Object.values(items).forEach(tx => {
                if (tx.from.toLowerCase() === wallet.toLowerCase()) {
                    txs.push(tx)
                }
            })

            if ((meta.currentPage === meta.totalPages) || meta.totalItems == 0) {
                isAllTxCollected = true
            } else {
                page++
            }
        }).catch(e => {
            retry++

            if (retry === 3) {
                isAllTxCollected = true
            }
        })
    }

    for (const tx of Object.values(txs)) {
        const date = new Date(tx.receivedAt)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        uniqueContracts.add(tx.to)
        stats[wallet].txcount++
        totalGasUsed += parseInt(tx.fee) / Math.pow(10, 18)

        let contract = contracts.find(contract => contract.address.toLowerCase() === tx.to.toLowerCase())

        if (contract) {
            protocols[contract.name].count++
        }
    }

    let isAllTransfersCollected = false
    let pageTransfers = 1
    retry = 0

    while (!isAllTransfersCollected) {
        await axios.get(apiUrl + '/address/' + wallet + '/transfers', {
            signal: newAbortSignal(5000),
            params: {
                limit: 100,
                page: pageTransfers
            }
        }).then(async response => {
            let items = response.data.items
            let meta = response.data.meta

            for (const transfer of Object.values(items)) {
                if (transfer.type === 'deposit' &&
                    transfer.from.toLowerCase() === wallet.toLowerCase() &&
                    transfer.to.toLowerCase() === wallet.toLowerCase()) {
                    bridgeTo++
                }

                if (transfer.type === 'withdrawal' &&
                    transfer.from.toLowerCase() === wallet.toLowerCase() &&
                    transfer.to.toLowerCase() === wallet.toLowerCase()) {
                    bridgeFrom++
                }

                if (transfer.token && transfer.from.toLowerCase() === wallet.toLowerCase()) {
                    if (stableSymbol.includes(transfer.token.symbol)) {
                        let amount = parseInt(transfer.amount) / Math.pow(10, transfer.token.decimals)
                        if (transfer.token.symbol.includes('ETH')) {
                            totalValue += amount * ethPrice
                        } else {
                            totalValue += amount
                        }
                    }
                }
            }

            if ((meta.currentPage === meta.totalPages) || meta.totalItems == 0) {
                isAllTransfersCollected = true
            } else {
                pageTransfers++
            }
        }).catch(e => {
            retry++

            if (retry === 3) {
                isAllTxCollected = true
            }
        })
    }

    if (stats[wallet].txcount) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].receivedAt)
        stats[wallet].last_tx_date = new Date(txs[0].receivedAt)
        stats[wallet].unique_days = uniqueDays.size
        stats[wallet].unique_weeks = uniqueWeeks.size
        stats[wallet].unique_months = uniqueMonths.size
        stats[wallet].unique_contracts = uniqueContracts.size
        stats[wallet].total_gas = totalGasUsed
        stats[wallet].volume = totalValue
        stats[wallet].bridge_to = bridgeTo
        stats[wallet].bridge_from = bridgeFrom
        stats[wallet].protocols = protocols
    }
}

async function lite(wallet) {
    await axios.post('https://api.zksync.io/jsrpc', {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "account_info",
        "params": [wallet]
    }).then(response => {
        stats[wallet].lite_eth = getBalance(parseFloat(response.data.result?.committed?.balances?.ETH || 0), 18)
        stats[wallet].lite_tx = parseInt(response.data.result?.committed?.nonce || 0)
    })

    await axios.get(`https://api.zksync.io/api/v0.2/accounts/${wallet}/transactions`, {
        params: {
            "from": 'latest',
            "limit": "1",
            "direction": "older"
        }
    }).then(response => {
        if (response.data.result.list.length) {
            stats[wallet].lite_last_tx = new Date(response.data.result.list[0].createdAt)
        }
    })

}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balances: [],
        txcount: 0
    }

    await getBalances(wallet)
    await getTxs(wallet)
    if (!args.includes('no-lite')) {
        await lite(wallet)
    }

    progressBar.update(iteration)

    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdLiteEthValue = (stats[wallet].lite_eth*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)

    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])
    total.lite_eth += stats[wallet].lite_eth || 0

    let row
    row = {
        n: parseInt(index)+1,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume ? '$'+stats[wallet].volume?.toFixed(2) : '$'+0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to / from': `${stats[wallet].bridge_to} / ${stats[wallet].bridge_from}`,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '—',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})` : 0
    }

    if (!args.includes('no-lite')) {
        row['Lite ETH'] = stats[wallet].lite_eth ? stats[wallet].lite_eth.toFixed(4) + ` ($${usdLiteEthValue})` : 0
        row['Lite TX'] = stats[wallet].lite_tx ? stats[wallet].lite_tx : 0
        row['Lite last TX'] = stats[wallet].lite_last_tx ? moment(stats[wallet].lite_last_tx).format("DD.MM.YY") : ''
    }

    p.addRow(row)
    jsonData.push({
        n: parseInt(index)+1,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume ? stats[wallet].volume?.toFixed(2) : 0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to': stats[wallet].bridge_to,
        'Bridge from': stats[wallet].bridge_from,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4): 0,
        'Total gas spent USDVALUE': stats[wallet].total_gas ? usdGasValue : 0,
        'Protocols': stats[wallet].protocols
    })

    iteration++
    if (iterations > 100) {
        await sleep(500)
    }
}

function fetchWallets() {
    wallets = readWallets('./addresses/zksync.txt')
    iterations = wallets.length
    iteration = 1
    jsonData = []
    csvData = []
    total = {
        eth: 0,
        usdc: 0,
        usdt: 0,
        dai: 0,
        gas: 0,
        lite_eth: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/zksync.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
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
                resolve(fetchBatch(batch))
            }, i * 5000)
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
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
        'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`,
    }

    if (!args.includes('no-lite')) {
        row['Lite ETH'] = total.lite_eth.toFixed(4) + ` ($${(total.lite_eth*ethPrice).toFixed(2)})`
    }

    p.addRow(row)
}

export async function zkSyncFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function zkSyncData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    let row = {
        wallet: 'Total',
        'ETH': total.eth.toFixed(4),
        'ETH USDVALUE': (total.eth*ethPrice).toFixed(2),
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'Total gas spent': total.gas.toFixed(4),
        'Total gas spent USDVALUE': (total.gas*ethPrice).toFixed(2),
    }

    if (!args.includes('no-lite')) {
        row['Lite ETH'] = total.lite_eth.toFixed(4) + ` ($${(total.lite_eth*ethPrice).toFixed(2)})`
    }

    jsonData.push(row)
    return jsonData
}