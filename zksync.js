import './common.js'
import {
    wait,
    sleep,
    random,
    readWallets,
    writeLineToFile,
    getBalance,
    timestampToDate,
    getEthPriceForDate
} from './common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

let headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
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
    { id: 'Total gas spent', title: 'Total gas spent'},

]

let columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
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
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'}
]

const args = process.argv.slice(2)

if (!args.includes('no-lite')) {
    headers.push({ id: 'Lite ETH', title: 'Lite ETH'})
    headers.push({ id: 'Lite TX', title: 'Lite TX'})
    headers.push({ id: 'Lite last TX', title: 'Lite last TX'})
    columns.push({ name: 'Lite ETH', alignment: 'right', color: 'cyan'})
    columns.push({ name: 'Lite TX', alignment: 'right', color: 'cyan'})
    columns.push({ name: 'Lite last TX', alignment: 'right', color: 'cyan'})
}

const csvWriter = createObjectCsvWriter({
    path: './results/zksync.csv',
    header: headers
})

const p = new Table({
  columns: columns
})

const apiUrl = "https://block-explorer-api.mainnet.zksync.io"

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

let stats = []
const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']
const stableSymbol = ['USDT', 'USDC', 'DAI', 'ZKUSD', 'CEBUSD', 'LUSD']

async function getBalances(wallet) {
    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })
    await axios.get(apiUrl+'/address/'+wallet).then(response => {
        let balances = response.data.balances

        Object.values(balances).forEach(balance => {
            if (balance.token) {
                if (filterSymbol.includes(balance.token.symbol)) {
                    stats[wallet].balances[balance.token.symbol] = getBalance(balance.balance, balance.token.decimals)
                }
            }
        })
    }).catch(function (error) {
        console.log(`${wallet}: ${error}`)
    })
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let totalGasUsed = 0
    let totalValue = 0
    let txs = []
    let page = 1
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/transactions', {
            params: {
                address: wallet,
                limit: 100,
                page: page
            }
        }).then(response => {
            let items = response.data.items
            let meta = response.data.meta
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if ((meta.currentPage === meta.totalPages) || meta.totalItems == 0) {
                isAllTxCollected = true
            } else {
                page++
            }
        }).catch()
    }

    stats[wallet].txcount = txs.length

    for (const tx of Object.values(txs)) {
        const date = new Date(tx.receivedAt)
        let value = parseInt(tx.value) / Math.pow(10, 18)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        uniqueContracts.add(tx.to)
        
        if (value > 0) {
            totalValue += value * ethPrice
        }
        totalGasUsed += parseInt(tx.fee) / Math.pow(10, 18)
    }

    let isAllTransfersCollected = false
    let pageTransfers = 1

    while (!isAllTransfersCollected) {
        await axios.get(apiUrl + '/address/' + wallet + '/transfers', {
            params: {
                limit: 100,
                page: pageTransfers
            }
        }).then(async response => {
            let items = response.data.items
            let meta = response.data.meta
            for (const transfer of Object.values(items)) {
                if (transfer.token && transfer.from === wallet) {
                    if (stableSymbol.includes(transfer.token.symbol)) {
                        let amount = parseInt(transfer.amount) / Math.pow(10, transfer.token.decimals)
                        totalValue += amount
                    }
                }
            }

            if ((meta.currentPage === meta.totalPages) || meta.totalItems == 0) {
                isAllTransfersCollected = true
            } else {
                pageTransfers++
            }
        }).catch()
    }

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].receivedAt)
        stats[wallet].last_tx_date = new Date(txs[0].receivedAt)
        stats[wallet].unique_days = uniqueDays.size
        stats[wallet].unique_weeks = uniqueWeeks.size
        stats[wallet].unique_months = uniqueMonths.size
        stats[wallet].unique_contracts = uniqueContracts.size
        stats[wallet].total_gas = totalGasUsed
        stats[wallet].total_value = totalValue
    }
}

async function lite(wallet) {
    await axios.post('https://api.zksync.io/jsrpc', {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "account_info",
        "params": [wallet]
    }).then(response => {
        stats[wallet].lite_eth = getBalance(parseFloat(response.data.result?.committed?.balances?.ETH || 0), 18)
        stats[wallet].lite_tx = parseInt(response.data.result?.committed?.nonce || 0)
    })

    await axios.get(`https://api.zksync.io/api/v0.2/accounts/${wallet}/transactions`, {
        params: {
            "from": 'latest',
            "limit": "1",
            "direction": "older"
        }
    }).then(response => {
        if (response.data.result.list.length) {
            stats[wallet].lite_last_tx = new Date(response.data.result.list[0].createdAt)
        }
    })

}

const wallets = readWallets('./addresses/zksync.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0,
    lite_eth: 0
}

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progressBar.start(iterations, 0)

for (let wallet of wallets) {
    stats[wallet] = {
        balances: []
    }

    await getBalances(wallet)
    await getTxs(wallet)
    if (!args.includes('no-lite')) {
        await lite(wallet)
    }
    progressBar.update(iteration)
    await sleep(1.5 * 1000)
    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdLiteEthValue = (stats[wallet].lite_eth*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)

    total.gas += stats[wallet].total_gas
    total.eth += stats[wallet].balances['ETH']
    total.usdt += stats[wallet].balances['USDT']
    total.usdc += stats[wallet].balances['USDC']
    total.dai += stats[wallet].balances['DAI']
    total.lite_eth += stats[wallet].lite_eth || 0

    let row
    if (stats[wallet].txcount) {
        row = {
            n: iteration,
            wallet: wallet,
            'ETH': stats[wallet].balances['ETH'].toFixed(4) + ` ($${usdEthValue})`,
            'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
            'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
            'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
            'TX Count': stats[wallet].txcount,
            'Contracts': stats[wallet].unique_contracts,
            'Days': stats[wallet].unique_days,
            'Weeks': stats[wallet].unique_weeks,
            'Months': stats[wallet].unique_months,
            'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
            'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
            'Total gas spent': stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})`
        }

        if (!args.includes('no-volume')) {
            row['Volume'] = '$'+stats[wallet].total_value.toFixed(2)
        }

        if (!args.includes('no-lite')) {
            row['Lite ETH'] = stats[wallet].lite_eth.toFixed(4) + ` ($${usdLiteEthValue})`
            row['Lite TX'] = stats[wallet].lite_tx
            row['Lite last TX'] = stats[wallet].lite_last_tx ? moment(stats[wallet].lite_last_tx).format("DD.MM.YY") : ''
        }

        p.addRow(row)
    }

    iteration++

    if (!--iterations) {
        progressBar.stop()
        p.addRow({})

        row = {
            wallet: 'Total',
            'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
            'USDC': total.usdc.toFixed(2),
            'USDT': total.usdt.toFixed(2),
            'DAI': total.dai.toFixed(2),
            'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`,
        }

        if (!args.includes('no-lite')) {
            row['Lite ETH'] = total.lite_eth.toFixed(4) + ` ($${(total.lite_eth*ethPrice).toFixed(2)})`
        }

        p.addRow(row)

        p.printTable()

        p.table.rows.map((row) => {
            csvData.push(row.text)
        })

        csvWriter.writeRecords(csvData)
            .then(() => console.log('Запись в CSV файл завершена'))
            .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error))
    }
}