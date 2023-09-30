import '../utils/common.js'
import {getKeyByValue, readWallets, sleep} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"

const csvWriter = createObjectCsvWriter({
    path: './results/layerzero.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'Wallet', title: 'Wallet'},
        { id: 'TX Count', title: 'TX Count'},
        { id: 'Volume', title: 'Volume'},
        { id: 'Source chains', title: 'Networks'},
        { id: 'Destination chains', title: 'Networks'},
        { id: 'Contracts', title: 'Contracts'},
        { id: 'Days', title: 'Days'},
        { id: 'Weeks', title: 'Weeks'},
        { id: 'Months', title: 'Months'},
        { id: 'First TX', title: 'First TX'},
        { id: 'Last TX', title: 'Last TX'},
    ]
})

const p = new Table({
    columns: [
        { name: 'n', color: 'green', alignment: "right"},
        { name: 'Wallet', color: 'green', alignment: "right"},
        { name: 'TX Count', alignment: 'right', color: 'cyan'},
        { name: 'Volume', alignment: 'right', color: 'cyan'},
        { name: 'Source chains', alignment: 'right', color: 'cyan'},
        { name: 'Destination chains', alignment: 'right', color: 'cyan'},
        { name: 'Contracts', alignment: 'right', color: 'cyan'},
        { name: 'Days', alignment: 'right', color: 'cyan'},
        { name: 'Weeks', alignment: 'right', color: 'cyan'},
        { name: 'Months', alignment: 'right', color: 'cyan'},
        { name: 'First TX', alignment: 'right', color: 'cyan'},
        { name: 'Last TX', alignment: 'right', color: 'cyan'},
    ],
    sort: (row1, row2) => +row1.n - +row2.n
})

const apiUrl = "http://65.109.29.224:3000/api/data"
let jsonData = []

async function fetchWallet(wallet, index) {
    let data = {
        wallet: '',
        tx_count: 0,
        volume: 0,
        source_chain: 0,
        dest_chain: 0,
        contracts: 0,
        days: 0,
        weeks: 0,
        month: 0,
        first_tx: '',
        last_tx: ''
    }

    let isParsed = false
    
    while (!isParsed) {
        await axios.get(apiUrl, {
            params: {
                wallet: wallet
            }
        }).then(response => {
            data = response.data
            progressBar.update(iteration)

            p.addRow({
                n: parseInt(index)+1,
                Wallet: wallet,
                'TX Count': data.tx_count,
                'Volume': data.volume,
                'Source chains': data.source_chain,
                'Destination chains': data.dest_chain,
                'Contracts': data.contracts,
                'Days': data.days,
                'Weeks': data.weeks,
                'Months': data.month,
                'First TX': data.first_tx ? moment((data.first_tx)).format("DD.MM.YY") : '-',
                'Last TX': data.last_tx ? moment((data.last_tx)).format("DD.MM.YY") : '-',
            })

            jsonData.push({
                n: parseInt(index)+1,
                Wallet: wallet,
                'TX Count': data.tx_count,
                'Volume': data.volume,
                'Source chains': data.source_chain,
                'Destination chains': data.dest_chain,
                'Contracts': data.contracts,
                'Days': data.days,
                'Weeks': data.weeks,
                'Months': data.month,
                'First TX': data.first_tx,
                'Last TX': data.last_tx,
            })

            isParsed = true
            iteration++
        }).catch(function (e) {
            
        })
    }
}

let wallets = readWallets('./addresses/layerzero.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function fetchWallets() {
    const batchSize = 50
    const batchCount = Math.ceil(wallets.length / batchSize)

    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * 5000)
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
    csvData.sort((a, b) => a.n - b.n)
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

    await fetchWallets()
    await saveToCsv()

    return jsonData
}