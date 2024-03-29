import  '../utils/common.js'
import { sleep, 
    readWallets, 
    getBalance, 
    getKeyByValue,
    getProxy,
    newAbortSignal,
    getTokenPrice,
    timestampToDate
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'Linea XP', color: 'green', alignment: "right"},
    { name: 'Voyage NFT', color: 'green', alignment: "right"},
    { name: 'PoH', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
    { name: 'USDT', alignment: 'right', color: 'cyan'},
    { name: 'DAI', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Volume', alignment: 'right', color: 'cyan'},
    { name: 'Contracts', alignment: 'right', color: 'cyan'},
    { name: 'Days', alignment: 'right', color: 'cyan'},
    { name: 'Weeks', alignment: 'right', color: 'cyan'},
    { name: 'Months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'},
]

const headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'Linea XP', title: 'Linea XP'},
    { id: 'Voyage NFT', title: 'Voyage NFT'},
    { id: 'PoH', title: 'PoH'},
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
    { id: 'USDT', title: 'USDT'},
    { id: 'DAI', title: 'DAI'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Volume', title: 'Volume'},
    { id: 'Contracts', title: 'Contracts'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
    { id: 'Total gas spent', title: 'Total gas spent'}
]

const contracts = [
    {
        token: 'Linea XP',
        address: '0xd83af4fbD77f3AB65C3B1Dc4B38D7e67AEcf599A',
        decimals: 18    
    },
    {
        token: 'USDC',
        address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
        decimals: 6
    },
    {
        token: 'USDT',
        address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
        decimals: 6
    },
    {
        token: 'DAI',
        address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
        decimals: 18
    },
    {
        token: 'BUSD',
        address: '0x7d43AABC515C356145049227CeE54B608342c0ad',
        decimals: 18
    }
]

let debug = false
const apiUrl = "https://api.w3w.ai/linea/v1/explorer/address"
let p
let csvWriter
let stats = []
let wallets = readWallets('./addresses/linea.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0,
    xp: 0
}
let stables = ['USDT', 'USDC', 'DAI']
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
let ethPrice = await getTokenPrice('ETH')

async function getBalances(wallet) {
    let ethBalanceDone
    let ethBalanceRetry = 0

    let tokenBalanceDone
    let tokenBalanceRetry = 0

    let pohDone
    let pohRetry = 0

    let voyageNft = ''

    while (!ethBalanceDone) {
        await axios.get(`${apiUrl}/${wallet}/profile`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            stats[wallet].balances['ETH'] = parseFloat(response.data.balance)
            ethBalanceDone = true
        }).catch(function (error) {
            if (debug) console.log(error)
            ethBalanceRetry++
            if (ethBalanceRetry > 3) {
                ethBalanceDone = true
            }
        })
    }

    stats[wallet].balances['Linea XP'] = 0
    stats[wallet].balances['USDC'] = 0
    stats[wallet].balances['USDT'] = 0
    stats[wallet].balances['DAI'] = 0
    
    while (!tokenBalanceDone) {
        await axios.get(`https://api.w3w.ai/linea/v2/explorer/address/${wallet}/token_holdings`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            const tokens = response.data.data
            for (const token of tokens) {
                if (token.token_symbol === 'VOYAGE') {
                    switch (token.token_id) {
                        case 1:
                            voyageNft = 'Alpha'
                            break
                        case 2:
                            voyageNft = 'Beta'
                            break
                        case 3:
                            voyageNft = 'Gamma'
                            break
                        case 4:
                            voyageNft = 'Delta'
                            break
                        case 5:
                            voyageNft = 'Omega'
                            break
                        default:
                            voyageNft = 'Alpha'
                            break
                    }
                } else {
                    stats[wallet].balances[token.token_symbol] = token.balance
                }
            }
            tokenBalanceDone = true
        }).catch(function (error) {
            if (debug) console.log(error)

            tokenBalanceRetry++
            if (tokenBalanceRetry > 3) {
                tokenBalanceDone = true
            }
        })
    }

    stats[wallet].voyagenft = voyageNft

    while (!pohDone) {
        await axios.get(`https://linea-xp-poh-api.linea.build/poh/${wallet}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(response => {
            stats[wallet].poh = response.data.poh
            pohDone = true
        }).catch(function (error) {
            if (debug) console.log(error)

            pohRetry++
            if (pohRetry > 3) {
                pohDone = true
            }
        })
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let txs = []
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(`${apiUrl}/${wallet}/transactions`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            let items = response.data.data
            stats[wallet].txcount = response.data.total
            isAllTxCollected = true

            Object.values(items).forEach(tx => {
                txs.push(tx)
            })
        }).catch(function (error) {
            if (debug) console.log(error)
        })
    }

    let totalGasUsed = 0

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.block_timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        
        totalGasUsed += parseFloat(tx.total_transaction_fee)

        if (tx.from_address.toLowerCase() === wallet.toLowerCase()) {
            uniqueContracts.add(tx.to_address)
        }

        stats[wallet].volume += parseFloat(tx.value) * ethPrice
    })

    let isAllTxTokensCollected
    while (!isAllTxTokensCollected) {
        await axios.get(`${apiUrl}/${wallet}/token_transfers?type=tokentxns`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            let items = response.data.data
            isAllTxTokensCollected = true

            Object.values(items).forEach(transfer => {
                if (stables.includes(transfer.token_symbol)) {
                    stats[wallet].volume += parseFloat(transfer.value)
                }
            })
        }).catch(function (error) {
            if (debug) console.log(error)
        })
    }

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].block_timestamp)
        stats[wallet].last_tx_date = new Date(txs[0].block_timestamp)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
        stats[wallet].total_gas = totalGasUsed
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        txcount: 0,
        volume: 0,
        balances: [],
        voyagenft: '',
        poh: false
    }

    await getBalances(wallet)
    await getTxs(wallet)
    
    progressBar.update(iteration)
    total.gas += stats[wallet].total_gas
    total.xp += stats[wallet].balances['LXP'] ? parseFloat(stats[wallet].balances['LXP']) : 0
    total.eth += stats[wallet].balances['ETH'] ? parseFloat(stats[wallet].balances['ETH']) : 0
    total.usdt += stats[wallet].balances['USDT'] ? parseFloat(stats[wallet].balances['USDT']) : 0
    total.usdc += stats[wallet].balances['USDC'] ? parseFloat(stats[wallet].balances['USDC']) : 0
    total.dai += stats[wallet].balances['DAI'] ? parseFloat(stats[wallet].balances['DAI']) : 0

    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)

    p.addRow({
        n: parseInt(index)+1,
        wallet: wallet,
        'Linea XP': stats[wallet].balances['LXP'],
        'Voyage NFT': stats[wallet].voyagenft,
        'PoH': stats[wallet].poh,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': `$`+parseInt(stats[wallet].volume),
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '-',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '-',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})` : 0
    })

    jsonData.push({
        n: parseInt(index)+1,
        wallet: wallet,
        'Linea XP': stats[wallet].balances['LXP'],
        'Voyage NFT': stats[wallet].voyagenft,
        'PoH': stats[wallet].poh,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': parseInt(stats[wallet].volume),
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': usdGasValue
    })

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets('./addresses/linea.txt')
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        eth: 0,
        usdc: 0,
        usdt: 0,
        dai: 0,
        gas: 0,
        xp: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/linea.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const batchSize = 10
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * 2000)
        })

        walletPromises.push(promise)
    }

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
    p.addRow({})
    p.addRow({
        wallet: 'Total',
        'Linea XP': total.xp,
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
    })
}

export async function lineaFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function lineaData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'Linea XP': total.xp,
        'ETH': total.eth.toFixed(4),
        'ETH USDVALUE': (total.eth*ethPrice).toFixed(2),
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'Total gas spent': total.gas.toFixed(4),
        'Total gas spent USDVALUE': (total.gas*ethPrice).toFixed(2),
    })

    return jsonData
}