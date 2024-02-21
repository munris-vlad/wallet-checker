import '../utils/common.js'
import {readWallets, getBalance, getKeyByValue, getTokenPrice} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

const headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
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

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
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

const apiUrl = "https://base.blockscout.com/api/v2"

let debug = true
let csvWriter
let p
let stats = []
let jsonData = []
let totalGas = 0
let totalUsdc = 0
let totalDai = 0
const filterSymbol = ['USDbC', 'DAI']
let wallets = readWallets('./addresses/base.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let totalEth = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
let ethPrice = await getTokenPrice('ETH')

async function getBalances(wallet) {
    await axios.get(apiUrl+'/addresses/'+wallet).then(response => {
        stats[wallet].balance = getBalance(response.data.coin_balance, 18)
    }).catch(function (e) {
        if (debug) console.log(e.toString())
    })

    await axios.get(apiUrl+'/addresses/'+wallet+'/token-balances').then(response => {
        let tokens = response.data

        Object.values(tokens).forEach(token => {
            if (filterSymbol.includes(token.token.symbol)) {
                stats[wallet].balances[token.token.symbol] = getBalance(token.value, token.token.decimals)
            }
        })
    }).catch(e => {
        if (debug) console.log(e.toString())
    })
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
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(apiUrl+'/addresses/'+wallet+'/transactions', {
            params: params.block_number === '' ? {} : params
        }).then(response => {
            let items = response.data.items
            Object.values(items).forEach(tx => {
                if (tx.from.hash.toLowerCase() == wallet.toLowerCase() && tx.result === 'success') {
                    txs.push(tx)
                }
            })

            if (response.data.next_page_params === null) {
                isAllTxCollected = true
            } else {
                params = response.data.next_page_params
            }
        }).catch(function (e) {
            if (debug) console.log(e.toString())
            isAllTxCollected = true
        })
    }

    stats[wallet].txcount = txs.length
    let totalFee = 0
    let volume = 0
    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        
        if (tx.to) {
            uniqueContracts.add(tx.to.hash)
        }

        totalFee += parseInt(tx.fee.value) / Math.pow(10, 18)
        volume += (parseInt(tx.value) / Math.pow(10, 18)) * ethPrice
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].timestamp)
        stats[wallet].last_tx_date = new Date(txs[0].timestamp)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = uniqueContracts.size
        stats[wallet].totalFee = totalFee
        stats[wallet].volume = volume
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balances: {
            USDbC: 0,
            DAI: 0
        },
        balance: 0
    }

    await getBalances(wallet)
    await getTxs(wallet)
    progressBar.update(iteration)
    let usdEthValue = (stats[wallet].balance*ethPrice).toFixed(2)
    let usdFeeEthValue = (stats[wallet].totalFee*ethPrice).toFixed(2)
    totalGas += stats[wallet].totalFee > 0 ? stats[wallet].totalFee : 0
    totalEth += stats[wallet].balance
    totalUsdc += parseFloat(stats[wallet].balances['USDbC'])
    totalDai += parseFloat(stats[wallet].balances['DAI'])

    let row
    row = {
        n: index,
        wallet: wallet,
        'ETH': stats[wallet].balance.toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDbC']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume ? '$'+stats[wallet].volume?.toFixed(2) : '$'+0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].first_tx_date ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '-',
        'Last tx': stats[wallet].last_tx_date ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '-',
        'Total gas spent': stats[wallet].totalFee ? stats[wallet].totalFee.toFixed(4) + ` ($${usdFeeEthValue})` : 0
    }

    p.addRow(row)
    jsonData.push({
        n: index,
        wallet: wallet,
        'ETH': stats[wallet].balance.toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDbC']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Volume': stats[wallet].volume ? stats[wallet].volume.toFixed(2) : '-',
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].totalFee ? stats[wallet].totalFee.toFixed(4) : 0,
        'Total gas spent USDVALUE': stats[wallet].totalFee ? usdFeeEthValue : 0
    })

    iteration++
}

function fetchWallets() {
    csvWriter = createObjectCsvWriter({
        path: './results/base.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    wallets = readWallets('./addresses/base.txt')
    const batchSize = 50
    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []
    iterations = wallets.length
    iteration = 1
    jsonData = []
    csvData = []
    totalEth = 0
    totalGas = 0
    totalUsdc = 0
    totalDai = 0

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * 3000)
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
        'ETH': totalEth.toFixed(4) + ` ($${(totalEth*ethPrice).toFixed(2)})`,
        'USDC': totalUsdc,
        'DAI': totalDai,
        'Total gas spent': totalGas.toFixed(4) + ` ($${(totalGas*ethPrice).toFixed(2)})`,
    })
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, parseInt(getKeyByValue(wallets, account))+1)))
}

export async function baseFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function baseData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'ETH': totalEth.toFixed(4),
        'ETH USDVALUE': (totalEth*ethPrice).toFixed(2),
        'USDC': totalUsdc,
        'DAI': totalDai,
        'Total gas spent': totalGas.toFixed(4),
        'Total gas spent USDVALUE': (totalGas*ethPrice).toFixed(2),
    })

    return jsonData
}