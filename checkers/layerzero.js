import '../utils/common.js'
import {getKeyByValue, readWallets, sleep} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'

const csvWriter = createObjectCsvWriter({
    path: './results/layerzero.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'Wallet', title: 'Wallet'},
        { id: 'Rank', title: 'Rank'},
        { id: 'TX Count', title: 'TX Count'},
        { id: 'Volume', title: 'Volume'},
        { id: 'Source chains', title: 'Networks'},
        { id: 'Destination chains', title: 'Networks'},
        { id: 'Contracts', title: 'Contracts'},
        { id: 'Months', title: 'Months'},

    ]
})

const p = new Table({
    columns: [
        { name: 'n', color: 'green', alignment: "right"},
        { name: 'Wallet', color: 'green', alignment: "right"},
        { name: 'Rank', alignment: 'right', color: 'cyan'},
        { name: 'TX Count', alignment: 'right', color: 'cyan'},
        { name: 'Volume', alignment: 'right', color: 'cyan'},
        { name: 'Source chains', alignment: 'right', color: 'cyan'},
        { name: 'Destination chains', alignment: 'right', color: 'cyan'},
        { name: 'Contracts', alignment: 'right', color: 'cyan'},
        { name: 'Months', alignment: 'right', color: 'cyan'},
    ],
    sort: (row1, row2) => +row1.n - +row2.n
})

const apiUrl = "https://api.nftcopilot.com/layer-zero-rank/check"

let stats = []
let jsonData = []


async function fetchWallet(wallet, index) {
    let data = {
        txsCount: 0,
        volume: 0,
        distinctMonth: 0,
        networks: 0,
        contracts: 0,
        destChains: 0,
        distinctMonths: 0
    }

    await axios.post(apiUrl, {
        address: wallet
    }).then(response => {
        data = response.data

    }).catch(function (e) {
        console.log(e.toString())
    })

    progressBar.update(iteration)
    let row

    row = {
        n: parseInt(index)+1,
        Wallet: wallet,
        Rank: data.rank,
        'TX Count': data.txsCount,
        'Volume': data.volume,
        'Source chains': data.networks,
        'Destination chains': data.destChains,
        'Contracts': data.contracts,
        'Months': data.distinctMonths
    }

    p.addRow(row)
    jsonData.push(row)

    iteration++
    await sleep(100)
}

let wallets = readWallets('./addresses/layerzero.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let totalEth = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function fetchWallets() {
    const batchSize = 20
    const batchCount = Math.ceil(wallets.length / batchSize)

    const walletPromises = [];

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * 2000)
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })

    csvWriter.writeRecords(csvData).then().catch()
}

export async function layerzeroFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function layerzeroData() {
    wallets = readWallets('./addresses/layerzero.txt')
    jsonData = []
    totalEth = 0

    await fetchWallets()
    await saveToCsv()

    return jsonData
}