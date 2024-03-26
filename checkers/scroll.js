import  '../utils/common.js'
import { sleep, readWallets, getBalance, getKeyByValue, getTokenPrice, newAbortSignal, getProxy } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'Origins NFT', color: 'green', alignment: "right"},
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
    { id: 'Origins NFT', title: 'Origins NFT'},
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
        token: 'Origins NFT',
        address: '0x74670A3998d9d6622E32D0847fF5977c37E0eC91',
        decimals: 0
    },
    {
        token: 'USDC',
        address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
        decimals: 6
    },
    {
        token: 'USDT',
        address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
        decimals: 6
    },
    {
        token: 'DAI',
        address: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97',
        decimals: 18
    }
]

let debug = false
const apiUrl = "https://api.scrollscan.com/api"
let p
let csvWriter
let stats = []
let wallets = readWallets('./addresses/scroll.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0
}
let stables = ['USDT', 'USDC', 'DAI']
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
let ethPrice = await getTokenPrice('ETH')

async function getBalances(wallet, index) {
    let agent = getProxy(index)
    let isBalanceCollected = false
    
    while (!isBalanceCollected) {
        try {
            await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'balance',
                    address: wallet
                },
                httpsAgent: agent,
                signal: newAbortSignal(5000)
            }).then(response => {
                if (!response.data.result.includes('Max rate limit reached')) {
                    stats[wallet].balances['ETH'] = getBalance(response.data.result, 18)
                    isBalanceCollected = true
                } else {
                    agent = getProxy(index)
                }
            })
        } catch (error) {
            if (debug) console.log(error)
        }
    }

    for (const contract of contracts) {
        let isContractBalanceCollected = false

        while (!isContractBalanceCollected) {
            try {
                await axios.get(apiUrl, {
                    params: {
                        module: 'account',
                        action: 'tokenbalance',
                        contractaddress: contract.address,
                        address: wallet
                    },
                    httpsAgent: agent,
                    signal: newAbortSignal(5000)
                }).then(response => {
                    if (!response.data.result.includes('Max rate limit reached')) {
                        stats[wallet].balances[contract.token] = getBalance(response.data.result, contract.decimals)
                        isContractBalanceCollected = true
                    } else {
                        agent = getProxy(index)
                    }
                })
            } catch (error) {
                if (debug) console.log(error)
            }
        }
    }
}

async function getTxs(wallet, index) {
    let agent = getProxy(index)
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let txs = []
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        try {
            await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'txlist',
                    offset: 1000,
                    address: wallet
                },
                httpsAgent: agent,
                signal: newAbortSignal(5000)
            }).then(response => {
                if (!response.data.result.includes('Max rate limit reached')) {
                    let items = response.data.result
                    isAllTxCollected = true

                    Object.values(items).forEach(tx => {
                        txs.push(tx)
                    })
                } else {
                    agent = getProxy(index)
                }
            })
        } catch (error) {
            if (debug) console.log(error)
        }
    }

    let totalGasUsed = 0

    Object.values(txs).forEach(tx => {
        if (tx.isError === '0') {
            const date = new Date(tx.timeStamp*1000)
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueContracts.add(tx.to)

            totalGasUsed += parseInt(tx.gasPrice) * parseInt(tx.gasUsed) / Math.pow(10, 18)

            if (tx.from) {
                if (tx.from.toLowerCase() === wallet.toLowerCase()) {
                    uniqueContracts.add(tx.to)
                    stats[wallet].txcount++
                }
            }

            if (!tx.functionName.includes('transfer') && !tx.functionName.includes('approve')) {
                stats[wallet].volume += parseFloat((parseInt(tx.value) / Math.pow(10, 18)) * ethPrice, 0)
            }
        }
    })

    let isAllTxTokensCollected
    while (!isAllTxTokensCollected) {
        try {
            await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'tokentx',
                    offset: 1000,
                    address: wallet
                },
                httpsAgent: agent,
                signal: newAbortSignal(5000)
            }).then(response => {
                if (!response.data.result.includes('Max rate limit reached')) {
                    let items = response.data.result
                    isAllTxTokensCollected = true

                    Object.values(items).forEach(transfer => {
                        if (stables.includes(transfer.tokenSymbol)) {
                            stats[wallet].volume += parseFloat((parseInt(transfer.value) / Math.pow(10, transfer.tokenDecimal)), 0)
                        }
                    })
                } else {
                    agent = getProxy(index)
                }
            })
        } catch (error) {
            if (debug) console.log(error)
        }
    }

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[0].timeStamp*1000)
        stats[wallet].last_tx_date = new Date(txs[txs.length - 1].timeStamp*1000)
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
        contractdeployed: 'No'
    }

    await getBalances(wallet, index)
    await getTxs(wallet, index)
    progressBar.update(iteration)
    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])

    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)

    p.addRow({
        n: parseInt(index)+1,
        wallet: wallet,
        'Origins NFT': parseInt(stats[wallet].balances['Origins NFT']) > 0 ? 'Yes' : 'No',
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
        'Origins NFT': parseInt(stats[wallet].balances['Origins NFT']) > 0 ? 'Yes' : 'No',
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
    wallets = readWallets('./addresses/scroll.txt')
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1
    total = {
        eth: 0,
        usdc: 0,
        usdt: 0,
        dai: 0,
        gas: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/scroll.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const batchSize = 7
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * 3000)
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
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
    })
}

export async function scrollFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function scrollData() {
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
        'Total gas spent': total.gas.toFixed(4),
        'Total gas spent USDVALUE': (total.gas*ethPrice).toFixed(2),
    })

    return jsonData
}