import { getNativeToken, random, readWallets, multicallAbi, multicallAddress, erc20Abi } from "../utils/common.js"
import { createPublicClient, http, parseAbi, formatUnits, defineChain } from 'viem'
import { Table } from "console-table-printer"
import { createObjectCsvWriter } from "csv-writer"
import { rpcs, config } from "../user_data/config.js"
import { chains, zero } from '../utils/chains.js'

const TABLE_CONFIG = {
    columns: [
        { name: 'n', alignment: 'left', color: 'green' },
        { name: 'wallet', color: 'green', alignment: "right" },
        { name: 'Tx count', color: 'green', alignment: "right" },
        { name: 'Native', alignment: 'right', color: 'cyan' },
        { name: 'NativeUSD', alignment: 'right', color: 'cyan' },
        { name: 'USDT', alignment: 'right', color: 'cyan' },
        { name: 'USDC', alignment: 'right', color: 'cyan' },
        { name: 'DAI', alignment: 'right', color: 'cyan' }
    ],
    headers: [
        { id: 'n', title: 'n' },
        { id: 'wallet', title: 'wallet' },
        { id: 'Tx count', title: 'Tx count' },
        { id: 'Native', title: 'Native' },
        { id: 'NativeUSD', title: 'NativeUSD' },
        { id: 'USDT', title: 'USDT' },
        { id: 'USDC', title: 'USDC' },
        { id: 'DAI', title: 'DAI' }
    ]
}

class EVMBalanceChecker {
    constructor() {
        this.wallets = readWallets(config.modules.balance.addresses)
        this.walletsData = []
        this.csvData = []
        this.isJson = false
        this.table = null
    }

    getClient(network) {
        const rpc = rpcs[network][random(0, rpcs[network].length - 1)]
        const chain = chains[network] || chains.ETH

        return createPublicClient({
            chain,
            transport: http(rpc),
            batch: { multicall: true }
        })
    }

    async fetchTransactionCounts(client) {
        const promises = this.wallets.map(wallet => 
            client.getTransactionCount({ address: wallet })
        )
        const results = await Promise.all(promises)
        return results.map((count, index) => ({ 
            address: this.wallets[index], 
            count 
        }))
    }

    createMulticallContracts(tokenAddress, wallets) {
        return wallets.map(wallet => ({
            address: tokenAddress,
            abi: parseAbi(erc20Abi),
            functionName: 'balanceOf',
            args: [wallet]
        }))
    }

    async fetchBalances(client, network) {
        const networkConfig = chains[network]
        if (!networkConfig) throw new Error(`Network ${network} not configured`)

        const balanceMulticall = this.wallets.map(wallet => ({
            address: multicallAddress,
            abi: multicallAbi,
            functionName: 'getEthBalance',
            args: [wallet]
        }))

        const results = {
            balances: await client.multicall({
                contracts: balanceMulticall,
                multicallAddress
            })
        }

        for (const [token, config] of Object.entries(networkConfig)) {
            if (token === 'nativePrice') continue
            
            const contracts = this.createMulticallContracts(config.address, this.wallets)
            results[token] = await client.multicall({
                contracts,
                multicallAddress
            })
        }

        return results
    }

    formatBalance(balance, decimals) {
        if (!balance?.result) return '0'
        return parseFloat(formatUnits(balance.result, decimals)).toFixed(decimals === 18 ? 4 : 1)
    }

    processWalletData(balanceResults, txCounts, network) {
        const networkConfig = chains[network]
        
        return this.wallets.map((wallet, index) => {
            const native = this.formatBalance(balanceResults.balances[index], 18)
            const nativeUSD = (parseFloat(native) * networkConfig.nativePrice).toFixed(2)
            
            const data = {
                n: index + 1,
                wallet,
                'Tx count': txCounts[index].count,
                Native: this.isJson ? native : `${native} ${getNativeToken(network)}`,
                NativeUSD: nativeUSD,
                USDT: '0',
                USDC: '0',
                DAI: '0'
            }

            if (balanceResults.USDT) {
                data.USDT = this.formatBalance(balanceResults.USDT[index], networkConfig.USDT.decimals)
            }
            if (balanceResults.USDC) {
                data.USDC = this.formatBalance(balanceResults.USDC[index], networkConfig.USDC.decimals)
            }
            if (balanceResults.DAI) {
                data.DAI = this.formatBalance(balanceResults.DAI[index], networkConfig.DAI.decimals)
            }

            return data
        })
    }

    calculateTotals(data) {
        const totals = {
            n: this.wallets.length + 1,
            wallet: 'Total',
            'Tx count': data.reduce((sum, row) => sum + row['Tx count'], 0),
            Native: '0',
            NativeUSD: '0',
            USDT: '0',
            USDC: '0',
            DAI: '0'
        }

        for (const key of ['Native', 'NativeUSD', 'USDT', 'USDC', 'DAI']) {
            totals[key] = data.reduce((sum, row) => sum + parseFloat(row[key] || 0), 0).toFixed(2)
        }

        return totals
    }

    async collectData(network = 'ETH') {
        const client = this.getClient(network)
        const [txCounts, balanceResults] = await Promise.all([
            this.fetchTransactionCounts(client),
            this.fetchBalances(client, network)
        ])

        this.walletsData = this.processWalletData(balanceResults, txCounts, network)
        const totals = this.calculateTotals(this.walletsData)
        this.walletsData.push(totals)

        this.table = new Table({ columns: TABLE_CONFIG.columns })
        this.table.addRows(this.walletsData)
        
        this.csvData = this.table.table.rows.map(row => row.text)
    }

    async saveToCsv(network) {
        const csvWriter = createObjectCsvWriter({
            path: `./results/balances_${network}.csv`,
            header: TABLE_CONFIG.headers
        })
        
        await csvWriter.writeRecords(this.csvData)
    }
}

export async function balancesFetchDataAndPrintTable(network) {
    const checker = new EVMBalanceChecker()
    await checker.collectData(network)
    checker.table.printTable()
    await checker.saveToCsv(network)
}

export async function balancesData(network) {
    const checker = new EVMBalanceChecker()
    checker.isJson = true
    await checker.collectData(network)
    await checker.saveToCsv(network)
    return checker.walletsData
}