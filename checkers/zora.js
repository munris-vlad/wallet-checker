import '../utils/common.js'
import {readWallets, getBalance, getProxy, getTokenPrice} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { HttpsProxyAgent } from "https-proxy-agent"

const agent = getProxy(0)

const headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'ETH', title: 'ETH'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Zora.co NFT', title: 'Zora.co NFT'},
    { id: 'Collection count', title: 'Collection count'},
    { id: 'NFT count', title: 'NFT count'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
]

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Zora.co NFT', alignment: 'right', color: 'cyan'},
    { name: 'Collection count', alignment: 'right', color: 'cyan'},
    { name: 'NFT count', alignment: 'right', color: 'cyan'},
    { name: 'Days', alignment: 'right', color: 'cyan'},
    { name: 'Weeks', alignment: 'right', color: 'cyan'},
    { name: 'Months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
]

const apiUrl = "https://explorer.zora.energy/api/v2"

let p
let csvWriter
let stats = []
let jsonData = []
let wallets = readWallets('./addresses/zora.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let totalEth = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

let ethPrice = await getTokenPrice('ETH')

async function getBalances(wallet) {
    await axios.get(apiUrl+'/addresses/'+wallet, {
        httpsAgent: agent
    }).then(response => {
        stats[wallet].balance = getBalance(response.data.coin_balance, 18)
    }).catch(function (error) {
    })

    await axios.get(apiUrl+'/addresses/'+wallet+'/token-balances', {
        httpsAgent: agent
    }).then(response => {
        let tokens = response.data

        Object.values(tokens).forEach(token => {
            stats[wallet].collection_count++
            if (token.token.type !== 'ERC-20') {
                stats[wallet].nft_count += parseInt(token.value)
            }
        })
    }).catch(e => {
    })
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
    let zoraNftCount = 0

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())

        if (parseInt(tx.value) === 777000000000000) {
            zoraNftCount++
        }
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
        stats[wallet].zora_nft = zoraNftCount
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balance: 0,
        collection_count: 0,
        nft_count: 0
    }

    await getBalances(wallet)
    await getTxs(wallet)
    progressBar.update(iteration)
    let usdEthValue = (stats[wallet].balance*ethPrice).toFixed(2)
    let row
    totalEth += stats[wallet].balance
    row = {
        n: index,
        wallet: wallet,
        'ETH': stats[wallet].balance.toFixed(4) + ` ($${usdEthValue})`,
        'TX Count': stats[wallet].txcount,
        'Collection count': stats[wallet].collection_count,
        'NFT count': stats[wallet].nft_count,
        'Zora.co NFT': stats[wallet].zora_nft,
        'Days': stats[wallet].unique_days,
        'Weeks': stats[wallet].unique_weeks,
        'Months': stats[wallet].unique_months,
        'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
        'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
    }

    p.addRow(row)
    jsonData.push({
        n: index,
        wallet: wallet,
        'ETH': stats[wallet].balance.toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'TX Count': stats[wallet].txcount,
        'Collection count': stats[wallet].collection_count ?? 0,
        'NFT count': stats[wallet].nft_count ?? 0,
        'Zora.co NFT': stats[wallet].zora_nft,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
    })

    iteration++

}

function fetchWallets() {
    wallets = readWallets('./addresses/zora.txt')
    iterations = wallets.length
    iteration = 1
    jsonData = []
    csvData = []
    totalEth = 0

    csvWriter = createObjectCsvWriter({
        path: './results/zora.csv',
        header: headers
    })
    
    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const walletPromises = wallets.map((account, index) => fetchWallet(account, index+1))
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
    })
}

export async function zoraFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function zoraData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'ETH': totalEth.toFixed(4),
        'ETH USDVALUE': (totalEth*ethPrice).toFixed(2),
    })

    return jsonData
}