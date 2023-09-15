import { AnkrProvider } from '@ankr.com/ankr.js'
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import dotenv from 'dotenv'
import {
    readWallets,
    balance,
    balanceTotal,
    balanceNative,
    getNativeToken,
    balanceTotalStable
} from '../utils/common.js'

dotenv.config()

const provider = new AnkrProvider('https://rpc.ankr.com/multichain/'+process.env.ANKR_API_KEY)

let columns = [
    { name: 'n', alignment: 'left'},
    { name: 'index', alignment: 'left'},
    { name: 'wallet', color: 'green', alignment: "right"}
]

let headers = [
    { id: 'n', title: 'n'},
    { id: 'wallet', title: 'wallet'},
]

let blockchains = ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche']
const args = process.argv.slice(2);
const network = args[0];

if (network) {
    blockchains = [network]
}

let totalBalances = []
let jsonData = []
let isJson = false
let p

const balances = async (address, index, network) => {
    const data = await provider.getAccountBalance({
        blockchain: blockchains,
        walletAddress: address,
        onlyWhitelisted: true
    })

    let balances = []

    for (const token of data.assets) {
        const { blockchain, tokenSymbol } = token
        const isNative = token.tokenType === 'NATIVE'
        const balanceUsd = parseFloat(token.balanceUsd)
        const balance = parseFloat(token.balance)

        if (!balances[blockchain]) {
            balances[blockchain] = { tokens: {} }
        }

        if (!totalBalances[blockchain]) {
            totalBalances[blockchain] = {}
        }

        if (balanceUsd > 0.1) {
            if (!totalBalances[blockchain][tokenSymbol]) {
                totalBalances[blockchain][tokenSymbol] = {
                    symbol: tokenSymbol,
                    usd: 0,
                    amount: 0
                }
            }

            let formattedBalance
            if (isNative) {
                formattedBalance = `$${balanceUsd.toFixed(2)} / ${balance.toFixed(3)} ${tokenSymbol}`
                balances[blockchain][tokenSymbol] = formattedBalance
            } else {
                formattedBalance = `$${balance.toFixed(2)}`
                balances[blockchain]['tokens'][tokenSymbol] = formattedBalance
            }

            totalBalances[blockchain][tokenSymbol].usd += balanceUsd
            totalBalances[blockchain][tokenSymbol].amount += balance
        }
    }

    for (const blockchain in balances) {
        if (balances[blockchain]['tokens'].length > 0) {
            balances[blockchain]['tokens'] = Object.entries(balances[blockchain]['tokens'])
                                                    .sort((a, b) => list[a[0]] - list[b[0]])
        }
    }

    const walletRow = blockchains.reduce((row, network) => {
        row[network] = `${balanceNative(balances, network)} | USDT: ${balance(balances, network, 'USDT')} | USDC: ${balance(balances, network, 'USDC')}`
        return row;
    }, { index: index, wallet: address, n: index });

    if (isJson) {
        jsonData.push({
            n: index,
            wallet: address,
            native: balanceNative(balances, network),
            USDT: balance(balances, network, 'USDT'),
            USDC: balance(balances, network, 'USDC')
        })
    } else {
        p.addRow(walletRow)
    }
}

const wallets = readWallets('./addresses/evm.txt')
function fetchBalances(network) {
    const balancePromises = wallets.map((account, index) => balances(account, index, network))
    return Promise.all(balancePromises)
}

let csvData = []

export async function balancesFetchDataAndPrintTable(network) {
    if (network) {
        blockchains = [network]
    }

    blockchains.forEach(blockchain => {
        columns.push({
            name: blockchain, alignment: "right", color: 'cyan'
        })

        headers.push({
            id: blockchain, title: blockchain
        })
    })

    p = new Table({
      columns: columns,
      disabledColumns: ["index"],
      sort: (row1, row2) => +row1.index - +row2.index
    })

    await fetchBalances()

    const totalRow = blockchains.reduce((row, network) => {
        row[network] = `${balanceTotal(totalBalances, network, getNativeToken(network))} | USDT: ${balanceTotalStable(totalBalances, network, 'USDT')} | USDC: ${balanceTotalStable(totalBalances, network, 'USDC')}`
        return row;
    }, { index: wallets.length + 3, wallet: 'TOTAL' });


    p.addRow(totalRow)
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })

    p.printTable()

    const csvWriter = createObjectCsvWriter({
        path: './results/balances.csv',
        header: headers
    })

    csvWriter.writeRecords(csvData)
        .then(() => console.log('Запись в CSV файл завершена'))
        .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error))
}

export async function balancesData(network) {
    isJson = true
    jsonData = []
    totalBalances = []
    if (network) {
        blockchains = [network]
    }

    await fetchBalances(network)

    jsonData.push({
        n: wallets.length+1,
        index: wallets.length+1,
        wallet: 'Total',
        native: balanceTotal(totalBalances, network, getNativeToken(network)),
        USDT: balanceTotalStable(totalBalances, network, 'USDT'),
        USDC: balanceTotalStable(totalBalances, network, 'USDC')
    })

    return jsonData
}