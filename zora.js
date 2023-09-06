import './common.js'
import {wait, sleep, random, readWallets, writeLineToFile, getBalance, timestampToDate} from './common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { HttpsProxyAgent } from "https-proxy-agent"

const agent = new HttpsProxyAgent('http://munris:munrisproxy@65.109.29.224:3128')

const csvWriter = createObjectCsvWriter({
    path: './results/zora.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'wallet', title: 'wallet'},
        { id: 'ETH', title: 'ETH'},
        { id: 'TX Count', title: 'TX Count'},
        { id: 'Collection count', title: 'Collection count'},
        { id: 'NFT count', title: 'NFT count'},
        { id: 'Unique days', title: 'Unique days'},
        { id: 'Unique weeks', title: 'Unique weeks'},
        { id: 'Unique months', title: 'Unique months'},
        { id: 'First tx', title: 'First tx'},
        { id: 'Last tx', title: 'Last tx'},
    ]
})

const p = new Table({
  columns: [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Collection count', alignment: 'right', color: 'cyan'},
    { name: 'NFT count', alignment: 'right', color: 'cyan'},
    { name: 'Unique days', alignment: 'right', color: 'cyan'},
    { name: 'Unique weeks', alignment: 'right', color: 'cyan'},
    { name: 'Unique months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
  ]
})

const apiUrl = "https://explorer.zora.energy/api/v2"

let stats = []

async function getBalances(wallet) {
    await axios.get(apiUrl+'/addresses/'+wallet, {
        httpsAgent: agent
    }).then(response => {
        stats[wallet].balance = getBalance(response.data.coin_balance, 18)
    }).catch(function (error) {
        console.log(error)
    })

    await axios.get(apiUrl+'/addresses/'+wallet+'/token-balances', {
        httpsAgent: agent
    }).then(response => {
        let tokens = response.data

        Object.values(tokens).forEach(token => {
            stats[wallet].collection_count++
            stats[wallet].nft_count += parseInt(token.value)
        })
    }).catch()
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let txs = []
    let params = {
        block_number: '',
        index: '',
        items_count: ''
    }
    let isAllTxCollected = false

    while (!isAllTxCollected) {
        await axios.get(apiUrl+'/addresses/'+wallet+'/transactions', {
            httpsAgent: agent,
            params: params.block_number === '' ? {} : params
        }).then(response => {
            let items = response.data.items
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (response.data.next_page_params === null) {
                isAllTxCollected = true
            } else {
                params = response.data.next_page_params
            }
        }).catch(function (e) {
            isAllTxCollected = true
        })
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
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
    }
}

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

const wallets = readWallets('./addresses/zora.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progressBar.start(iterations, 0)
let totalEth = 0

for (let wallet of wallets) {
    stats[wallet] = {
        balance: 0,
        collection_count: 0,
        nft_count: 0
    }

    await getBalances(wallet)
    await getTxs(wallet)
    progressBar.update(iteration)
    await sleep(1.5 * 1000)
    let usdEthValue = (stats[wallet].balance*ethPrice).toFixed(2)
    let row
    totalEth += stats[wallet].balance
    row = {
        n: iteration,
        wallet: wallet,
        'ETH': stats[wallet].balance.toFixed(4) + ` ($${usdEthValue})`,
        'TX Count': stats[wallet].txcount,
        'Collection count': stats[wallet].collection_count,
        'NFT count': stats[wallet].nft_count,
        'Unique days': stats[wallet].unique_days,
        'Unique weeks': stats[wallet].unique_weeks,
        'Unique months': stats[wallet].unique_months,
        'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
        'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
    }

    p.addRow(row)

    iteration++

    if (!--iterations) {
        progressBar.stop()

        row = {
            wallet: 'Total',
            'ETH': totalEth.toFixed(4) + ` ($${(totalEth*ethPrice).toFixed(2)})`,
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