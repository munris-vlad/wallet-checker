import  '../utils/common.js'
import { sleep, 
    readWallets, 
    getBalance, 
    getKeyByValue,
    getProxy,
    newAbortSignal,
    ethPrice,
    timestampToDate
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import { formatEther, parseEther } from 'viem'

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'Linea XP', color: 'green', alignment: "right"},
    { name: 'LXP-L Points', color: 'green', alignment: "right"},
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
    { id: 'LXP-L Points', title: 'LXP-L Points'},
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

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('linea')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.linea.addresses)
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
    xp: 0,
    lxplpoints: 0
}
let stables = ['USDT', 'USDC', 'DAI']
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const reqHeaders =  {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://explorer.linea.build/",
    "Referrer-Policy": "origin-when-cross-origin"
}

async function getBalances(wallet) {
    let ethBalanceDone
    let ethBalanceRetry = 0

    let tokenBalanceDone
    let tokenBalanceRetry = 0

    let pohDone
    let pohRetry = 0

    let lxplpointsDone = false
    let lxplpointsRetry = 0

    let voyageNft = ''

    while (!ethBalanceDone) {
        await axios.get(`https://api-explorer.linea.build/api/v2/addresses/${wallet}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            stats[wallet].balances['ETH'] = formatEther(parseEther(response.data.coin_balance)) / Math.pow(10, 18)
            ethBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)
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
        await axios.get(`https://api-explorer.linea.build/api/v2/addresses/${wallet}/tokens?type=ERC-20`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            const tokens = response.data.items
            for (const token of tokens) {
                stats[wallet].balances[token.token.symbol] = formatEther(parseEther(token.value)) / Math.pow(10, parseInt(token.token.decimals))
            }
            tokenBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            tokenBalanceRetry++
            if (tokenBalanceRetry > 3) {
                tokenBalanceDone = true
            }
        })
    }

    let nftBalanceDone = false, nftBalanceRetry = 0
    while (!nftBalanceDone) {
        await axios.get(`https://api-explorer.linea.build/api/v2/addresses/${wallet}/tokens?type=ERC-1155`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            const tokens = response.data.items
            for (const token of tokens) {
                if (token.token.symbol === 'VOYAGE') {
                    switch (token.token_id) {
                        case '1':
                            voyageNft = 'Alpha'
                            break
                        case '2':
                            voyageNft = 'Beta'
                            break
                        case '3':
                            voyageNft = 'Gamma'
                            break
                        case '4':
                            voyageNft = 'Delta'
                            break
                        case '5':
                            voyageNft = 'Omega'
                            break
                        default:
                            voyageNft = 'Alpha'
                            break
                    }
                }
            }
            nftBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            nftBalanceRetry++
            if (nftBalanceRetry > 3) {
                nftBalanceDone = true
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
            if (config.debug) console.log(error.toString())

            pohRetry++
            if (pohRetry > 3) {
                pohDone = true
            }
        })
    }

    while (!lxplpointsDone) {
        await axios.get(`https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/linea/getUserPointsSearch?user=${wallet.toLowerCase()}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(response => {
            if (response.data.length) {
                stats[wallet].lxplpoints = response.data[0].xp
            }

            lxplpointsDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error.toString())

            lxplpointsRetry++
            if (lxplpointsRetry > 3) {
                lxplpointsDone = true
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
    let params = {
        block_number: '',
        index: '',
        items_count: ''
    }
    let isAllTxCollected = false, retry = 0

    while (!isAllTxCollected && retry < 3) {
        await axios.get(`https://api-explorer.linea.build/api/v2/addresses/${wallet}/transactions`, {
            params: params.block_number === '' ? {} : params,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.items

            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (response.data.next_page_params === null) {
                isAllTxCollected = true
            } else {
                params = response.data.next_page_params
            }
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retry++
        })
    }

    stats[wallet].txcount = txs.length

    let totalGasUsed = 0

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        
        totalGasUsed += formatEther(parseEther(tx.fee.value)) / Math.pow(10, 18)

        if (tx.from) {
            if (tx.from.hash.toLowerCase() === wallet.toLowerCase()) {
                if (tx.to) {
                    uniqueContracts.add(tx.to.hash)
                }
            }
        }

        stats[wallet].volume += parseFloat(tx.value) * ethPrice
    })

    let isAllTxTokensCollected, retryTransfers = 0
    let transferParams = {
        block_number: '',
        index: '',
        items_count: ''
    }

    while (!isAllTxTokensCollected && retryTransfers < 3) {
        await axios.get(`https://api-explorer.linea.build/api/v2/addresses/${wallet}/token-transfers`, {
            params: transferParams.block_number === '' ? {} : transferParams,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.items
            isAllTxTokensCollected = true

            Object.values(items).forEach(transfer => {
                if (stables.includes(transfer.token_symbol)) {
                    stats[wallet].volume += parseFloat(transfer.value)
                }
            })

            if (response.data.next_page_params === null) {
                isAllTxTokensCollected = true
            } else {
                transferParams = response.data.next_page_params
            }
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retryTransfers++
        })
    }

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size
    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].timestamp)
        stats[wallet].last_tx_date = new Date(txs[0].timestamp)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
        stats[wallet].total_gas = totalGasUsed
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'linea')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            txcount: 0,
            lxplpoints: 0,
            volume: 0,
            balances: { ETH: 0, USDT: 0, USDC: 0, DAI: 0, LXP: 0 },
            voyagenft: '',
            poh: null
        }

        await getBalances(wallet)
        await getTxs(wallet)
    }
    
    progressBar.update(iteration)
    total.gas += stats[wallet].total_gas
    total.xp += stats[wallet].balances['LXP'] ? parseFloat(stats[wallet].balances['LXP']) : 0
    total.lxplpoints += stats[wallet].lxplpoints ? parseInt(stats[wallet].lxplpoints) : 0
    total.eth += stats[wallet].balances['ETH'] ? parseFloat(stats[wallet].balances['ETH']) : 0
    total.usdt += stats[wallet].balances['USDT'] ? parseFloat(stats[wallet].balances['USDT']) : 0
    total.usdc += stats[wallet].balances['USDC'] ? parseFloat(stats[wallet].balances['USDC']) : 0
    total.dai += stats[wallet].balances['DAI'] ? parseFloat(stats[wallet].balances['DAI']) : 0

    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)

    p.addRow({
        n: parseInt(index)+1,
        wallet: wallet,
        'Linea XP': parseInt(stats[wallet].balances['LXP']),
        'LXP-L Points': stats[wallet].lxplpoints,
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
        'Linea XP': parseInt(stats[wallet].balances['LXP']),
        'LXP-L Points': stats[wallet].lxplpoints,
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

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'linea', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.linea.addresses)
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
        xp: 0,
        lxplpoints: 0
    }

    csvWriter = createObjectCsvWriter({
        path: './results/linea.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('linea')

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
        'Linea XP': total.xp.toFixed(0),
        'LXP-L Points': total.lxplpoints,
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
        'LXP-L Points': total.lxplpoints,
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

export async function lineaFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function lineaClean() {
    await cleanByChecker('linea')
}