import { AnkrProvider } from '@ankr.com/ankr.js'
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import {
    wait,
    sleep,
    random,
    readWallets,
    writeLineToFile,
    balance,
    balanceTotal,
    balanceNative,
    balanceTopToken, getNativeToken, balanceTotalStable
} from './common.js'
import dotenv from 'dotenv'

dotenv.config();

const provider = new AnkrProvider('https://rpc.ankr.com/multichain/'+process.env.ANKR_API_KEY)

let columns = [
    { name: 'index', alignment: 'left'},
    { name: 'wallet', color: 'green', alignment: "right"}
]

let headers = [
    { id: 'wallet', title: 'wallet'},
]

let blockchains = ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche']
const args = process.argv.slice(2);
const network = args[0];

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

const p = new Table({
  columns: columns,
  disabledColumns: ["index"],
  sort: (row1, row2) => +row1.index - +row2.index
})

const csvWriter = createObjectCsvWriter({
    path: './results/balances.csv',
    header: headers
})

let totalBalances = []

const balances = async (address, index) => {
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
    }, { index: index, wallet: address });

    p.addRow(walletRow)
}


const wallets = readWallets('./addresses/evm.txt')
function fetchBalances() {
    const balancePromises = wallets.map((account, index) => balances(account, index))
    return Promise.all(balancePromises)
}

let csvData = []

async function fetchDataAndPrintTable() {
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

    csvWriter.writeRecords(csvData)
        .then(() => console.log('Запись в CSV файл завершена'))
        .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error))
}

fetchDataAndPrintTable().catch(error => {
    console.error('Произошла ошибка:', error)
})

