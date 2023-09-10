import './common.js'
import {wait, sleep, random, readWallets, writeLineToFile, getBalance, timestampToDate} from './common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

const csvWriter = createObjectCsvWriter({
    path: './results/aptos.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'wallet', title: 'wallet'},
        { id: 'APT', title: 'APT'},
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
})

const p = new Table({
    columns: [
        { name: 'n', color: 'green', alignment: "right"},
        { name: 'wallet', color: 'green', alignment: "right"},
        { name: 'APT', alignment: 'right', color: 'cyan'},
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
    ],
    sort: (row1, row2) => +row1.n - +row2.n
})

const apiUrl = "https://api.apscan.io"

let stats = []
const filterSymbol = ['APT', 'USDT', 'USDC', 'DAI']

async function getBalances(wallet) {
    await axios.get(apiUrl+'/accounts?address=eq.'+wallet).then(response => {
        if (response.data.length) {
            let balances = response.data[0].all_balances

            filterSymbol.forEach(symbol => {
                stats[wallet].balances[symbol] = 0
            })

            Object.values(balances).forEach(balance => {
                if (balance.coin_info) {
                    if (filterSymbol.includes(balance.coin_info.symbol)) {
                        stats[wallet].balances[balance.coin_info.symbol] = getBalance(balance.balance, balance.coin_info.decimals)
                    }
                }
            })
        }
    }).catch()
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let totalGasUsed = 0
    let txs = []
    let startRange = 0, endRange = 50
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/user_transactions?sender=eq.' + wallet, {
            headers: {
                range: `${startRange}-${endRange}`
            }
        }).then(response => {
            let items = response.data
            if (items.length) {
                Object.values(items).forEach(tx => {
                    txs.push(tx)
                })
                startRange = startRange + 50
                endRange = endRange + 50
            } else {
                isAllTxCollected = true
            }
        }).catch()
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(timestampToDate(tx.time_microseconds / 1000000))
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        totalGasUsed += parseInt(tx.gas_used) / Math.pow(10, 6)
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(timestampToDate(txs[txs.length - 1].time_microseconds / 1000000))
        stats[wallet].last_tx_date = new Date(timestampToDate(txs[0].time_microseconds / 1000000))
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].total_gas = totalGasUsed
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balances: []
    }

    await getBalances(wallet)
    await getTxs(wallet)
    progressBar.update(iteration)
    let usdAptValue = (stats[wallet].balances['APT']*aptPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*aptPrice).toFixed(2)
    let row
    if (stats[wallet].txcount) {
        row = {
            n: index,
            wallet: wallet,
            'APT': stats[wallet].balances['APT'].toFixed(2) + ` ($${usdAptValue})`,
            'USDC': stats[wallet].balances['USDC'].toFixed(2),
            'USDT': stats[wallet].balances['USDT'].toFixed(2),
            'DAI': stats[wallet].balances['DAI'].toFixed(2),
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

    iteration++
}

let aptPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=APT&tsyms=USD').then(response => {
    aptPrice = response.data.USD
})

const wallets = readWallets('./addresses/aptos.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progressBar.start(iterations, 0)

function fetchWallets() {
    const walletPromises = wallets.map((account, index) => fetchWallet(account, index+1))
    return Promise.all(walletPromises)
}

async function fetchDataAndPrintTable() {
    await fetchWallets()

    progressBar.stop()
    p.printTable()

    p.table.rows.map((row) => {
        csvData.push(row.text)
    })

    csvWriter.writeRecords(csvData)
        .then(() => console.log('Запись в CSV файл завершена'))
        .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error))
}

fetchDataAndPrintTable().catch(error => {
    console.error('Произошла ошибка:', error)
})