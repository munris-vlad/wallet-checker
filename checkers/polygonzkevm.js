import  '../utils/common.js'
import { sleep, random, readWallets, ethPrice, getKeyByValue, getTokenPrice, newAbortSignal, getProxy, multicallAbi, multicallAddress, erc20Abi } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config, rpcs } from '../user_data/config.js'
import { polygonZkEvm } from 'viem/chains'
import { createPublicClient, http, formatEther, parseAbi, formatUnits } from 'viem'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
    { name: 'USDT', alignment: 'right', color: 'cyan'},
    { name: 'DAI', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Volume', alignment: 'right', color: 'cyan'},
    { name: 'Contracts', alignment: 'right', color: 'cyan'},
    { name: 'Bridge to', alignment: 'right', color: 'cyan'},
    { name: 'Bridge from', alignment: 'right', color: 'cyan'},
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
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
    { id: 'USDT', title: 'USDT'},
    { id: 'DAI', title: 'DAI'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Volume', title: 'Volume'},
    { id: 'Contracts', title: 'Contracts'},
    { id: 'Bridge to', title: 'Bridge to'},
    { id: 'Bridge from', title: 'Bridge from'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
    { id: 'Total gas spent', title: 'Total gas spent'}
]

const apiUrl = "https://api-zkevm.polygonscan.com/api"

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('polygonzkevm')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.polygonzkevm.addresses)
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
    marks: 0
}
let stables = ['USDT', 'USDC', 'DAI']
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchBalances(wallets) {
    wallets.map(wallet => {
        stats[wallet] = {
            balances: {
                'ETH': 0,
                'USDT': 0,
                'USDC': 0,
                'DAI': 0,
            }
        }
    })

    let daiResults, balanceResults, usdtResults, usdcResults
    let isSuccess = false, retry = 0
    const rpc = rpcs['Polygonzkevm'][random(0, rpcs['Polygonzkevm'].length-1)]

    while (!isSuccess) {
        const client = createPublicClient({ chain: polygonZkEvm, transport: http(rpc), batch: { multicall: true } })
        try {
            const balanceMulticall = wallets.map(wallet => {
                return {
                    address: multicallAddress,
                    abi: multicallAbi,
                    functionName: 'getEthBalance',
                    args: [wallet]
                }
            })

            balanceResults = await client.multicall({
                contracts: balanceMulticall,
                multicallAddress: multicallAddress
            })

            const usdtMulticall = wallets.map(wallet => {
                return {
                    address: '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
                    abi: parseAbi(erc20Abi),
                    functionName: 'balanceOf',
                    args: [wallet]
                }
            })

            usdtResults = await client.multicall({
                contracts: usdtMulticall,
                multicallAddress: multicallAddress
            })

            
            const usdcMulticall = wallets.map(wallet => {
                return {
                    address: '0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035',
                    abi: parseAbi(erc20Abi),
                    functionName: 'balanceOf',
                    args: [wallet]
                }
            })

            usdcResults = await client.multicall({
                contracts: usdcMulticall,
                multicallAddress: multicallAddress
            })

            const daiMulticall = wallets.map(wallet => {
                return {
                    address: '0xc5015b9d9161dca7e18e32f6f25c4ad850731fd4',
                    abi: parseAbi(erc20Abi),
                    functionName: 'balanceOf',
                    args: [wallet]
                }
            })

            daiResults = await client.multicall({
                contracts: daiMulticall,
                multicallAddress: multicallAddress
            })

            isSuccess = true
        } catch (e) {
            if (config.debug) console.log(e.toString())

            retry++

            if (retry > 3) {
                isSuccess = true
            }
        }
    }

    wallets.map((wallet, index) => {
        let eth = formatEther(balanceResults[index].result)
        let usdt = usdtResults[index] ? parseFloat(formatUnits(usdtResults[index].result, 6)).toFixed(1) : 0
        let usdc = usdcResults[index] ? parseFloat(formatUnits(usdcResults[index].result, 6)).toFixed(1) : 0
        let dai = daiResults[index] ? parseFloat(formatUnits(daiResults[index].result, 18)).toFixed(1) : 0

        stats[wallet].balances = {
            'ETH': eth,
            'USDT': usdt,
            'USDC': usdc,
            'DAI': dai,
        }
    })
}

async function getTxs(wallet, index) {
    let agent = getProxy(index, true)
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let txs = []
    let isAllTxCollected = false
    let retry = 0
    let bridgeTo = 0, bridgeToVolume = 0
    let bridgeFrom = 0, bridgeFromVolume = 0

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
                signal: newAbortSignal(15000)
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
            if (config.debug) console.log(error)
            agent = getProxy(index, true)

            retry++

            if (retry > 3) {
                isAllTxCollected = true
            }
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

            if (tx.to.toLowerCase() === ('0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe').toLowerCase()) {
                bridgeFrom++
                bridgeFromVolume += parseFloat((parseInt(tx.value) / Math.pow(10, 18)) * ethPrice, 0)
            }
        }
    })

    let isAllTxTokensCollected
    retry = 0
    while (!isAllTxTokensCollected) {
        agent = getProxy(index, true)
        try {
            await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'tokentx',
                    offset: 1000,
                    address: wallet
                },
                httpsAgent: agent,
                signal: newAbortSignal(15000)
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
            if (config.debug) console.log(error)
            agent = getProxy(index, true)

            retry++

            if (retry > 3) {
                isAllTxTokensCollected = true
            }
        }
    }

    let isInternalCollected
    retry = 0
    while (!isInternalCollected) {
        agent = getProxy(index, true)
        try {
            await axios.get(apiUrl, {
                params: {
                    module: 'account',
                    action: 'txlistinternal',
                    offset: 1000,
                    address: wallet
                },
                httpsAgent: agent,
                signal: newAbortSignal(15000)
            }).then(response => {
                if (!response.data.result.includes('Max rate limit reached')) {
                    let items = response.data.result
                    isInternalCollected = true
                    Object.values(items).forEach(internal => {
                        if (internal.from.toLowerCase() === ('0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe').toLowerCase()) {
                            bridgeTo++
                            bridgeToVolume += parseFloat((parseInt(internal.value) / Math.pow(10, 18)) * ethPrice, 0)
                        }
                    })
                } else {
                    agent = getProxy(index)
                }
            })
        } catch (error) {
            if (config.debug) console.log(error)
            agent = getProxy(index, true)

            retry++

            if (retry > 3) {
                isInternalCollected = true
            }
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
        stats[wallet].bridge_to = bridgeTo + ` ($${bridgeToVolume.toFixed(0)})`
        stats[wallet].bridge_from = bridgeFrom
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    stats[wallet].txcount = 0
    stats[wallet].volume = 0
    stats[wallet].bridge_to = 0
    stats[wallet].bridge_from = 0

    // await getBalances(wallet, index)
    const existingData = await getWalletFromDB(wallet, 'polygonzkevm')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        await getTxs(wallet, index)
    }

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
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': `$`+parseInt(stats[wallet].volume),
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to': stats[wallet].bridge_to,
        'Bridge from': stats[wallet].bridge_from,
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
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': parseInt(stats[wallet].volume),
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to': stats[wallet].bridge_to,
        'Bridge from': stats[wallet].bridge_from,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': usdGasValue
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'polygonzkevm', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.polygonzkevm.addresses)
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
        path: './results/polygonzkevm.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 7
    let timeout = 3000

    const walletsInDB = await getCountByChecker('polygonzkevm')

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
                resolve(fetchBatch(batch))
            }, i * timeout)
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

export async function polygonzkevmFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchBalances(wallets)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function polygonzkevmData() {
    await fetchBalances(wallets)
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

export async function polygonzkevmFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function polygonzkevmClean() {
    await cleanByChecker('polygonzkevm')
}