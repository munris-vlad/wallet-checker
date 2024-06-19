import { getNativeToken, random, readWallets, multicallAbi, multicallAddress, erc20Abi, redstone, ethPrice, maticPrice, bnbPrice, avaxPrice, corePrice, celoPrice, klayPrice, ftmPrice, glmrPrice, movrPrice} from "../utils/common.js"
import axios from "axios"
import { Table } from "console-table-printer"
import { createObjectCsvWriter } from "csv-writer"
import { rpcs } from "../user_data/config.js"
import { createPublicClient, http, formatEther, parseAbi, formatUnits } from 'viem'
import { arbitrum, avalanche, base, blast, bsc, celo, coreDao, fantom, klaytn, mainnet, moonbeam, moonriver, opBNB, optimism, polygon } from "viem/chains"
import { config } from '../user_data/config.js'

let columns = [
    { name: 'n', alignment: 'left', color: 'green' },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'Tx count', color: 'green', alignment: "right" },
    { name: 'Native', alignment: 'right', color: 'cyan' },
    { name: 'NativeUSD', alignment: 'right', color: 'cyan' },
    { name: 'USDT', alignment: 'right', color: 'cyan' },
    { name: 'USDC', alignment: 'right', color: 'cyan' },
    { name: 'DAI', alignment: 'right', color: 'cyan' },
]

let headers = [
    { id: 'n', title: 'n' },
    { id: 'wallet', title: 'wallet' },
    { id: 'Tx count', title: 'Tx count' },
    { id: 'Native', title: 'Native' },
    { id: 'NativeUSD', title: 'NativeUSD' },
    { id: 'USDT', title: 'USDT' },
    { id: 'USDC', title: 'USDC' },
    { id: 'DAI', title: 'DAI' },
]

const networks = {
    'ETH': {
        'nativePrice': ethPrice,
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
        'nativePrice': ethPrice,
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
        'nativePrice': ethPrice,
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
        'nativePrice': maticPrice
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
        'nativePrice': bnbPrice
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
        'nativePrice': avaxPrice
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
        'nativePrice': ethPrice
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
        'nativePrice': corePrice
    },
    'opBNB': {
        'USDT': {
            address: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
            decimals: 6
        },
        'nativePrice': bnbPrice
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
        'nativePrice': celoPrice
    },
    'Klaytn': {
        'USDT': {
            address: '0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167',
            decimals: 6
        },
        'nativePrice': klayPrice
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
        'nativePrice': ftmPrice
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
        'nativePrice': glmrPrice
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
        'nativePrice': movrPrice
    },
    'Redstone': {
        'nativePrice': ethPrice
    },
    'Blast': {
        'nativePrice': ethPrice,
        'USDB': {
            address: '0x4300000000000000000000000000000000000003',
            decimals: 18
        },
    }
}

let wallets = readWallets(config.modules.evm.addresses)
let walletsData = []
let csvData = []
let p
let isJson = false

function getClient(network) {
    const rpc = rpcs[network][random(0, rpcs[network].length-1)]

    switch (network) {
        case 'ETH':
            return createPublicClient({ chain: mainnet, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Arbitrum':
            return createPublicClient({ chain: arbitrum, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Optimism':
            return createPublicClient({ chain: optimism, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Polygon':
            return createPublicClient({ chain: polygon, transport: http(rpc), batch: { multicall: true } })
            break
        case 'BSC':
            return createPublicClient({ chain: bsc, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Avalanche':
            return createPublicClient({ chain: avalanche, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Base':
            return createPublicClient({ chain: base, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Core':
            return createPublicClient({ chain: coreDao, transport: http(rpc), batch: { multicall: true } })
            break
        case 'opBNB':
            return createPublicClient({ chain: opBNB, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Celo':
            return createPublicClient({ chain: celo, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Klaytn':
            return createPublicClient({ chain: klaytn, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Fantom':
            return createPublicClient({ chain: fantom, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Moonbeam':
            return createPublicClient({ chain: moonbeam, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Moonriver':
            return createPublicClient({ chain: moonriver, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Redstone':
            return createPublicClient({ chain: redstone, transport: http(rpc), batch: { multicall: true } })
            break
        case 'Blast':
            return createPublicClient({ chain: blast, transport: http(rpc), batch: { multicall: true } })
            break
    }
}

async function fetchWallets(network) {
    walletsData = []
    csvData = []
    wallets = readWallets(config.modules.evm.addresses)

    let transactionCounts
    let daiResults, balanceResults, usdtResults, usdcResults, usdceResults, usdbResults

    let isSuccess = false, retry = 0

    while (!isSuccess) {
        const client = getClient(network)
        try {
            const promises = wallets.map(wallet => client.getTransactionCount({ address: wallet }))

            await Promise.all(promises).then(results => {
                transactionCounts = results.map((count, index) => ({ address: wallets[index], count }))
            })

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

            if (networks[network]['USDT']) {
                const usdtMulticall = wallets.map(wallet => {
                    return {
                        address: networks[network]['USDT'].address,
                        abi: parseAbi(erc20Abi),
                        functionName: 'balanceOf',
                        args: [wallet]
                    }
                })

                usdtResults = await client.multicall({
                    contracts: usdtMulticall,
                    multicallAddress: multicallAddress
                })
            }

            if (networks[network]['USDC']) {
                const usdcMulticall = wallets.map(wallet => {
                    return {
                        address: networks[network]['USDC'].address,
                        abi: parseAbi(erc20Abi),
                        functionName: 'balanceOf',
                        args: [wallet]
                    }
                })

                usdcResults = await client.multicall({
                    contracts: usdcMulticall,
                    multicallAddress: multicallAddress
                })
            }
            
            if (networks[network]['USDC.e']) {
                const usdceMulticall = wallets.map(wallet => {
                    return {
                        address: networks[network]['USDC.e'].address,
                        abi: parseAbi(erc20Abi),
                        functionName: 'balanceOf',
                        args: [wallet]
                    }
                })

                usdceResults = await client.multicall({
                    contracts: usdceMulticall,
                    multicallAddress: multicallAddress
                })
            }

            if (networks[network]['DAI']) {
                const daiMulticall = wallets.map(wallet => {
                    return {
                        address: networks[network]['DAI'].address,
                        abi: parseAbi(erc20Abi),
                        functionName: 'balanceOf',
                        args: [wallet]
                    }
                })

                daiResults = await client.multicall({
                    contracts: daiMulticall,
                    multicallAddress: multicallAddress
                })
            }

            if (networks[network]['USDB']) {
                const usdbMuticall = wallets.map(wallet => {
                    return {
                        address: networks[network]['USDB'].address,
                        abi: parseAbi(erc20Abi),
                        functionName: 'balanceOf',
                        args: [wallet]
                    }
                })

                usdbResults = await client.multicall({
                    contracts: usdbMuticall,
                    multicallAddress: multicallAddress
                })
            }

            isSuccess = true
        } catch (e) {
            if (config.debug) console.log(e.toString())

            retry++

            if (retry > 3) {
                isSuccess = true
            }
        }
    }

    walletsData = wallets.map((wallet, index) => {
        let eth = 0
        let usdt = 0
        let usdc = 0
        let dai = 0

        if (balanceResults) {
            eth = formatEther(balanceResults[index].result)
        } else {
            eth = 0
        }

        if (networks[network]['USDC.e']) {
            usdc = parseFloat(formatUnits(usdcResults[index].result, networks[network]['USDC'].decimals) + formatUnits(usdceResults[index].result, networks[network]['USDC.e'].decimals)).toFixed(1)
        } else {
            if (networks[network]['USDC']) {
                usdc = parseFloat(formatUnits(usdcResults[index].result, networks[network]['USDC'].decimals)).toFixed(1)
            }
        }

        if (networks[network]['DAI']) {
            dai = parseFloat(formatUnits(daiResults[index].result, networks[network]['DAI'].decimals)).toFixed(1)
        }

        if (networks[network]['USDT']) {
            usdt = parseFloat(formatUnits(usdtResults[index].result, networks[network]['USDT'].decimals)).toFixed(1)
        }

        if (networks[network]['USDB'] && usdbResults) {
            usdt = parseFloat(formatUnits(usdbResults[index].result, networks[network]['USDB'].decimals)).toFixed(1)
        }

        return {
            'n': index + 1,
            'wallet': wallet,
            'Tx count': transactionCounts ? transactionCounts[index].count : 0,
            'Native': parseFloat(eth).toFixed(3),
            'NativeUSD': parseFloat(parseFloat(eth) * networks[network].nativePrice).toFixed(2),
            'USDT': usdt,
            'USDC': usdc,
            'DAI': dai,
        }
    })

    p = new Table({
        columns: columns
    })
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