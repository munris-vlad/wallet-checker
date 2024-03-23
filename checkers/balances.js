import { ethers } from "ethers"
import { FetchRequest } from "ethers"
import { getNativeToken, random, readWallets, getKeyByValue, getProxy } from "../utils/common.js"
import axios from "axios"
import { Table } from "console-table-printer"
import { createObjectCsvWriter } from "csv-writer"
import { rpcs } from "../rpc.js"

let columns = [
    { name: 'n', alignment: 'left', color: 'green' },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'Tx count', color: 'green', alignment: "right" },
    { name: 'NativeUSD', alignment: 'right', color: 'cyan' },
    { name: 'USDT', alignment: 'right', color: 'cyan' },
    { name: 'USDC', alignment: 'right', color: 'cyan' },
    { name: 'DAI', alignment: 'right', color: 'cyan' },
]

let headers = [
    { id: 'n', title: 'n' },
    { id: 'wallet', title: 'wallet' },
    { id: 'Tx count', title: 'Tx count' },
    { id: 'NativeUSD', title: 'NativeUSD' },
    { id: 'USDT', title: 'USDT' },
    { id: 'USDC', title: 'USDC' },
    { id: 'DAI', title: 'DAI' },
]

const priceApi = 'https://min-api.cryptocompare.com/data/price'
const networks = {
    'ETH': {
        'nativePrice': await axios.get(priceApi + '?fsym=ETH&tsyms=USD').then(r => { return r.data.USD }),
        'USDT': {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6
        },
        'USDC': {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 18
        },
        'DAI': {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18
        }
    },
    'Arbitrum': {
        'nativePrice': await axios.get(priceApi + '?fsym=ETH&tsyms=USD').then(r => { return r.data.USD }),
        'USDT': {
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6
        },
        'USDC': {
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            decimals: 18
        },
        'USDC.e': {
            address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            decimals: 6
        },
        'DAI': {
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            decimals: 18
        }
    },
    'Optimism': {
        'nativePrice': await axios.get(priceApi + '?fsym=ETH&tsyms=USD').then(r => { return r.data.USD }),
        'USDT': {
            address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
            decimals: 6
        },
        'USDC': {
            address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
            decimals: 18
        },
        'DAI': {
            address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            decimals: 18
        }
    },
    'Polygon': {
        'USDT': {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6
        },
        'USDC': {
            address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            decimals: 18
        },
        'DAI': {
            address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            decimals: 18
        },
        'nativePrice': await axios.get(priceApi + '?fsym=MATIC&tsyms=USD').then(r => { return r.data.USD })
    },
    'BSC': {
        'USDT': {
            address: '0x55d398326f99059ff775485246999027b3197955',
            decimals: 18
        },
        'USDC': {
            address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            decimals: 18
        },
        'DAI': {
            address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
            decimals: 18
        },
        'nativePrice': await axios.get(priceApi + '?fsym=BNB&tsyms=USD').then(r => { return r.data.USD })
    },
    'Avalanche': {
        'USDT': {
            address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            decimals: 6
        },
        'USDC': {
            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            decimals: 18
        },
        'USDC.e': {
            address: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            decimals: 18
        },
        'DAI': {
            address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
            decimals: 18
        },
        'nativePrice': await axios.get(priceApi + '?fsym=AVAX&tsyms=USD').then(r => { return r.data.USD })
    },
    'Base': {
        'USDT': {
            address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
            decimals: 18
        },
        'USDC': {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=ETH&tsyms=USD').then(r => { return r.data.USD })
    },
    'Core': {
        'USDT': {
            address: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
            decimals: 6
        },
        'USDC': {
            address: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=CORE&tsyms=USD').then(r => { return r.data.USD })
    },
    'opBNB': {
        'USDT': {
            address: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=BNB&tsyms=USD').then(r => { return r.data.USD })
    },
    'Celo': {
        'USDT': {
            address: '0xb020D981420744F6b0FedD22bB67cd37Ce18a1d5',
            decimals: 6
        },
        'USDC': {
            address: '0xef4229c8c3250c675f21bcefa42f58efbff6002a',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=CELO&tsyms=USD').then(r => { return r.data.USD })
    },
    'Klaytn': {
        'USDT': {
            address: '0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=KLAY&tsyms=USD').then(r => { return r.data.USD })
    },
    'Fantom': {
        'USDT': {
            address: '0x049d68029688eabf473097a2fc38ef61633a3c7a',
            decimals: 6
        },
        'USDC': {
            address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=FTM&tsyms=USD').then(r => { return r.data.USD })
    },
    'Moonbeam': {
        'USDT': {
            address: '0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73',
            decimals: 6
        },
        'USDC': {
            address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=GLMR&tsyms=USD').then(r => { return r.data.USD })
    },
    'Moonriver': {
        'USDT': {
            address: '0xe936caa7f6d9f5c9e907111fcaf7c351c184cda7',
            decimals: 6
        },
        'USDC': {
            address: '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d',
            decimals: 6
        },
        'nativePrice': await axios.get(priceApi + '?fsym=MOVR&tsyms=USD').then(r => { return r.data.USD })
    }
}

let debug = false
let wallets = readWallets('./addresses/evm.txt')
let walletsData = []
let csvData = []
let stables = ['USDT', 'USDC', 'USDC.e', 'DAI']
let p
let isJson = false

function getProvider(network) {
    let agent = getProxy()
    let rpc = rpcs[network][random(0, rpcs[network].length - 1)]

    const fetchReq = new FetchRequest(rpc)
    fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({ agent })
    const provider = new ethers.JsonRpcProvider(fetchReq)

    return provider
}

async function fetchWallet(wallet, index, network) {
    let nativeBalance = 0
    let txCount = 0
    let provider = getProvider(network)

    let nativeDone = false
    let txCountDone = false
    let stableDone = false

    let nativeRetry = 0
    let txCountRetry = 0
    let stableRetry = 0

    while (!nativeDone) {
        try {
            const nativeBalanceWei = await provider.getBalance(wallet)
            nativeBalance = parseInt(nativeBalanceWei) / Math.pow(10, 18)
            nativeDone = true
        } catch (e) {
            if (debug) console.log(e.toString())
            provider = getProvider(network)
            nativeRetry++

            if (nativeRetry > 3) {
                nativeDone = true
            }
        }
    }

    while (!txCountDone) {
        try {
            txCount = await provider.getTransactionCount(wallet)
            txCountDone = true
        } catch (e) {
            if (debug) console.log(e.toString())
            provider = getProvider(network)

            txCountRetry++

            if (txCountRetry > 3) {
                txCountDone = true
            }
        }
    }

    let walletData = {
        n: index,
        wallet: wallet,
        'Tx count': txCount,
        Native: nativeBalance.toFixed(3),
        NativeUSD: nativeBalance > 0 ? (nativeBalance * networks[network].nativePrice).toFixed(2) : 0
    }

    walletData['USDC'] = 0
    walletData['USDC.e'] = 0
    walletData['USDT'] = 0
    walletData['DAI'] = 0

    while (!stableDone) {
        try {
            for (const stable of stables) {
                if (networks[network][stable]) {
                    let tokenContract = new ethers.Contract(networks[network][stable].address, ['function balanceOf(address) view returns (uint256)'], provider)
                    let balance = await tokenContract.balanceOf(wallet)
                    walletData[stable] = parseInt(balance) / Math.pow(10, networks[network][stable].decimals)
                    walletData[stable] = walletData[stable] > 0 ? walletData[stable].toFixed(2) : 0
                }
            }

            walletData['USDC'] = parseFloat(walletData['USDC']) + parseFloat(walletData['USDC.e'])
            delete walletData['USDC.e']
            stableDone = true
        } catch (e) {
            if (debug) console.log(e.toString())
            provider = getProvider(network)

            stableRetry++

            if (stableRetry > 3) {
                stableDone = true
            }
        }
    }

    walletsData.push(walletData)
}

async function fetchWalletAllNetwork(wallet, index) {
    let nativeBalance = 0
    let walletData = {
        n: index,
        wallet: wallet,
        'Tx count': 0,
        NativeUSD: 0,
        USDC: 0,
        'USDC.e': 0,
        USDT: 0,
        DAI: 0
    }

    for (const [networkName, network] of Object.entries(networks)) {
        let rpc = rpcs[networkName][random(0, rpcs[networkName].length - 1)]
        let provider = new ethers.providers.JsonRpcProvider(rpc)

        try {
            const nativeBalanceWei = await provider.getBalance(wallet)
            nativeBalance = parseInt(nativeBalanceWei) / Math.pow(10, 18)
        } catch (e) { }

        walletData.NativeUSD = parseFloat(walletData.NativeUSD) + parseFloat(nativeBalance > 0 ? (nativeBalance * network.nativePrice).toFixed(2) : 0)

        try {
            for (const stable of stables) {
                if (network[stable]) {
                    let stableData
                    let tokenContract = new ethers.Contract(network[stable].address, ['function balanceOf(address) view returns (uint256)'], provider)
                    let balance = await tokenContract.balanceOf(wallet)
                    stableData = parseInt(balance) / Math.pow(10, network[stable].decimals)
                    stableData = parseFloat(stableData) > 0 ? stableData.toFixed(2) : 0
                    walletData[stable] = (parseFloat(walletData[stable]) + parseFloat(stableData)).toFixed(2)
                }
            }
        } catch (e) { }
    }
    walletData.NativeUSD = parseFloat(walletData.NativeUSD.toFixed(2))
    walletData['USDC'] = parseFloat(walletData['USDC']) + parseFloat(walletData['USDC.e'])
    walletData['USDT'] = parseFloat(walletData['USDT'])
    walletData['DAI'] = parseFloat(walletData['DAI'])
    delete walletData['USDC.e']
    walletsData.push(walletData)
}

async function fetchBatch(batch, network) {
    await Promise.all(batch.map((account) => fetchWallet(account, getKeyByValue(wallets, account), network)))
}

async function fetchWallets(network) {
    walletsData = []
    csvData = []
    wallets = readWallets('./addresses/evm.txt')
    let walletPromises = []

    if (network === 'all') {
        walletPromises = wallets.map((account, index) => fetchWalletAllNetwork(account, index + 1))
    } else {
        columns.push({ name: 'Native', alignment: 'right', color: 'cyan' })
        headers.push({ id: 'Native', title: 'Native' })
        // walletPromises = wallets.map((account, index) => fetchWallet(account, index+1, network))

        const batchSize = 100
        const batchCount = Math.ceil(wallets.length / batchSize)

        for (let i = 0; i < batchCount; i++) {
            const startIndex = i * batchSize
            const endIndex = (i + 1) * batchSize
            const batch = wallets.slice(startIndex, endIndex)

            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(fetchBatch(batch, network))
                }, i * 5000)
            })

            walletPromises.push(promise)
        }
    }

    p = new Table({
        columns: columns
    })

    return Promise.all(walletPromises)
}

async function collectData(network) {
    if (!network) {
        network = 'ETH'
    }
    await fetchWallets(network)

    let totalRow = {
        Native: 0,
        NativeUSD: 0,
        USDT: 0,
        USDC: 0,
        DAI: 0,
    }

    walletsData.forEach((obj) => {
        for (const key in totalRow) {
            totalRow[key] += parseFloat(obj[key]) || 0
        }
        if (network != 'all') {
            if (isJson) {
                obj.Native = obj.Native
                obj.Native_name = getNativeToken(network)
            } else {
                obj.Native = obj.Native + ' ' + getNativeToken(network)
            }
        }
    })

    for (const key in totalRow) {
        totalRow[key] = totalRow[key] > 0 ? parseFloat(totalRow[key]).toFixed(key === 'Native' ? 3 : 2) : 0
    }

    if (network != 'all') {
        // totalRow.Native = 0
        totalRow.Native = totalRow.Native + ' ' + getNativeToken(network)
    }

    totalRow.n = wallets.length + 1
    totalRow.wallet = 'Total'

    walletsData.push(totalRow)

    columns.push({
        name: network, alignment: "right", color: 'cyan'
    })

    headers.push({
        id: network, title: network
    })

    walletsData.sort((a, b) => a.n - b.n)

    p.addRows(walletsData)

    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
}

async function saveToCsv(network) {
    const csvWriter = createObjectCsvWriter({
        path: `./results/balances_${network}.csv`,
        header: headers
    })

    csvWriter.writeRecords(csvData).then().catch()
}

export async function balancesFetchDataAndPrintTable(network) {
    await collectData(network)

    p.printTable()
    await saveToCsv(network)
}

export async function balancesData(network) {
    isJson = true
    await collectData(network)
    await saveToCsv(network)
    return walletsData
}