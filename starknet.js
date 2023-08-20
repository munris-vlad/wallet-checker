import './common.js'
import {wait, sleep, random, readWallets, writeLineToFile, getBalance, timestampToDate} from './common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

const csvWriter = createObjectCsvWriter({
    path: './results/starknet.csv',
    header: [
        { id: 'wallet', title: 'wallet'},
        { id: 'ETH', title: 'ETH'},
        { id: 'USDC', title: 'USDC'},
        { id: 'USDT', title: 'USDT'},
        { id: 'DAI', title: 'DAI'},
        { id: 'TX Count', title: 'TX Count'},
        { id: 'Unique days', title: 'Unique days'},
        { id: 'Unique weeks', title: 'Unique weeks'},
        { id: 'Unique months', title: 'Unique months'},
        { id: 'First tx', title: 'First tx'},
        { id: 'Last tx', title: 'Last tx'},
        { id: 'Total gas spent', title: 'Total gas spent'}
    ]
});

const p = new Table({
  columns: [
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
    { name: 'USDT', alignment: 'right', color: 'cyan'},
    { name: 'DAI', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Unique days', alignment: 'right', color: 'cyan'},
    { name: 'Unique weeks', alignment: 'right', color: 'cyan'},
    { name: 'Unique months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'},
  ]
})

const apiUrl = "https://voyager.online/api/"

let stats = []
const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']

async function getBalances(wallet) {
    let isBalancesFetched = false
    while (!isBalancesFetched) {
        await axios.get(apiUrl + '/contract/' + wallet + '/balances').then(response => {
            let balances = response.data
            stats[wallet].balances = []

            filterSymbol.forEach(symbol => {
                stats[wallet].balances[symbol] = 0
            })

            if (balances) {
                isBalancesFetched = true
                Object.values(balances).forEach(balance => {
                    if (filterSymbol.includes(balance.symbol)) {
                        stats[wallet].balances[balance.symbol] = balance.amount
                    }
                })
            }
        }).catch(async function (error) {
            console.log('')
            console.log(`Ошибка получения балансов, ждем 2 минуты и пробуем еще раз...`)
            await sleep(120 * 1000)
        })
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let totalGasUsed = 0
    let txs = []
    let page = 1
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/txns', {
            params: {
                to: wallet,
                page: page
            }
        }).then(response => {
            let items = response.data.items
            let lastPage = response.data.lastPage
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (page === lastPage) {
                isAllTxCollected = true
            } else {
                page++
            }
        }).catch(async function (error) {
            console.log('')
            console.log(`Ошибка получения транзакций, ждем 2 минуты и пробуем еще раз...`)
            await sleep(120 * 1000)
        })
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(timestampToDate(tx.timestamp))
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        totalGasUsed += parseInt(tx.actual_fee) / Math.pow(10, 18)
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(timestampToDate(txs[txs.length - 1].timestamp))
        stats[wallet].last_tx_date = new Date(timestampToDate(txs[0].timestamp))
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].total_gas = totalGasUsed
    }
}

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

const wallets = readWallets('./addresses/starknet.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(iterations, 0);

for (let wallet of wallets) {
    stats[wallet] = {}

    await getBalances(wallet)
    await sleep(4 * 1000)
    await getTxs(wallet)
    await sleep(4 * 1000)
    progressBar.update(iteration++);

    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let row
    if (stats[wallet].txcount) {
        row = {
            wallet: wallet,
            'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
            'USDC': stats[wallet].balances['USDC'],
            'USDT': stats[wallet].balances['USDT'],
            'DAI': stats[wallet].balances['DAI'],
            'TX Count': stats[wallet].txcount,
            'Unique days': stats[wallet].unique_days,
            'Unique weeks': stats[wallet].unique_weeks,
            'Unique months': stats[wallet].unique_months,
            'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
            'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
            'Total gas spent': stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})`
        }

        p.addRow(row)
    }

    if (!--iterations) {
        progressBar.stop();
        p.printTable()

        p.table.rows.map((row) => {
            csvData.push(row.text);
        })

        csvWriter.writeRecords(csvData)
            .then(() => console.log('Запись в CSV файл завершена'))
            .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error));
    }
}