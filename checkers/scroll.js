import  '../utils/common.js'
import { sleep, random, readWallets, ethPrice, getKeyByValue, getTokenPrice, newAbortSignal, getProxy, multicallAbi, multicallAddress, erc20Abi } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config, rpcs } from '../user_data/config.js'
import { scroll } from 'viem/chains'
import { createPublicClient, http, formatEther, parseAbi, formatUnits } from 'viem'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'Marks', color: 'green', alignment: "right"},
    { name: 'Origins NFT', color: 'green', alignment: "right"},
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
    { id: 'Marks', title: 'Marks'},
    { id: 'Origins NFT', title: 'Origins NFT'},
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

const apiUrl = "https://api.scrollscan.com/api"
const marksApi = "https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/scroll/bridge-balances?walletAddress="
const marksApiProjects = "https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/scroll/project-marks?walletAddress="

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('scroll')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.scroll.addresses)
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
                'Origins NFT': 'No'
            }
        }
    })

    let daiResults, balanceResults, usdtResults, usdcResults, originsResults
    let isSuccess = false, retry = 0
    const rpc = rpcs['Scroll'][random(0, rpcs['Scroll'].length-1)]

    while (!isSuccess) {
        const client = createPublicClient({ chain: scroll, transport: http(rpc), batch: { multicall: true } })
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
                    address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
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
                    address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
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
                    address: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97',
                    abi: parseAbi(erc20Abi),
                    functionName: 'balanceOf',
                    args: [wallet]
                }
            })

            daiResults = await client.multicall({
                contracts: daiMulticall,
                multicallAddress: multicallAddress
            })

            const originsMulticall = wallets.map(wallet => {
                return {
                    address: '0x74670A3998d9d6622E32D0847fF5977c37E0eC91',
                    abi: parseAbi(erc20Abi),
                    functionName: 'balanceOf',
                    args: [wallet]
                }
            })

            originsResults = await client.multicall({
                contracts: originsMulticall,
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
        let origins = parseInt(originsResults[index].result)

        stats[wallet].balances = {
            'ETH': eth,
            'USDT': usdt,
            'USDC': usdc,
            'DAI': dai,
            'Origins NFT': origins,
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
    let bridgeTo = 0
    let bridgeFrom = 0
    let isMarksCollected = false
    let marksRetry = 0
    let marks = 0

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

    while (!isMarksCollected) {
        await axios.get(marksApi+wallet, {
            httpsAgent: agent,
            signal: newAbortSignal(15000)
        }).then(response => {
            if (response.data) {
                Object.values(response.data).forEach(marksCategory => {
                    marks += marksCategory.points ? marksCategory.points : 0
                })
            }

            isMarksCollected = true
        }).catch(error => {
            if (config.debug) console.log(error.toString())
            agent = getProxy(index, true)

            marksRetry++

            if (marksRetry > 3) {
                isMarksCollected = true
            }
        })

        await axios.get(marksApiProjects+wallet, {
            httpsAgent: agent,
            signal: newAbortSignal(15000)
        }).then(response => {
            if (response.data) {
                Object.values(response.data[0].dex).forEach(marksCategory => {
                    if (marksCategory.project === 'Others') {
                        Object.values(marksCategory.items).forEach(item => {
                            marks += item.marks ? item.marks : 0
                        })
                    } else {
                        marks += marksCategory.marks ? marksCategory.marks : 0
                    }
                })

                Object.values(response.data[0].lending).forEach(marksCategory => {
                    marks += marksCategory.marks ? marksCategory.marks : 0
                })
            }

            isMarksCollected = true
        }).catch(error => {
            if (config.debug) console.log(error.toString())
            agent = getProxy(index, true)

            marksRetry++

            if (marksRetry > 3) {
                isMarksCollected = true
            }
        })
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

            if (tx.to === '0x781e90f1c8fc4611c9b7497c3b47f99ef6969cbc') {
                bridgeFrom++
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
                        if (internal.from === '0x781e90f1c8fc4611c9b7497c3b47f99ef6969cbc') {
                            bridgeTo++
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
        stats[wallet].bridge_to = bridgeTo
        stats[wallet].bridge_from = bridgeFrom
        stats[wallet].marks = parseFloat(marks).toFixed(2)
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    stats[wallet].txcount = 0
    stats[wallet].volume = 0
    stats[wallet].bridge_to = 0
    stats[wallet].bridge_from = 0
    stats[wallet].marks = 0

    // await getBalances(wallet, index)
    const existingData = await getWalletFromDB(wallet, 'scroll')
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
    total.marks += parseInt(stats[wallet].marks)

    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)

    p.addRow({
        n: parseInt(index)+1,
        wallet: wallet,
        'Marks': stats[wallet].marks,
        'Origins NFT': parseInt(stats[wallet].balances['Origins NFT']) > 0 ? 'Yes' : 'No',
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
        'Marks': stats[wallet].marks,
        'Origins NFT': parseInt(stats[wallet].balances['Origins NFT']) > 0 ? true : false,
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
        await saveWalletToDB(wallet, 'scroll', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.scroll.addresses)
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
        marks: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/scroll.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 7
    let timeout = 3000

    const walletsInDB = await getCountByChecker('scroll')

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
        'Marks': total.marks,
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
    })
}

export async function scrollFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchBalances(wallets)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function scrollData() {
    await fetchBalances(wallets)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'Marks': total.marks,
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

export async function scrollFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function scrollClean() {
    await cleanByChecker('scroll')
}