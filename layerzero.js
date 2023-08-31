import './common.js'
import {sleep, readWallets} from './common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'

const csvWriter = createObjectCsvWriter({
    path: './results/linea.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'wallet', title: 'wallet'},
        { id: 'Score', title: 'Score'},
        { id: 'Transactions', title: 'Transactions'},
        { id: 'Transfers', title: 'Transfers'},
        { id: 'NFT Transfers', title: 'NFT Transfers'},
        { id: 'Volume', title: 'Volume'},
        { id: 'Counterparties Count', title: 'Counterparties Count'},
        { id: 'Age', title: 'Age'},
    ]
})

const p = new Table({
  columns: [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'Score', color: 'green', alignment: "right"},
    { name: 'Transactions', color: 'green', alignment: "right"},
    { name: 'Transfers', color: 'green', alignment: "right"},
    { name: 'NFT Transfers', color: 'green', alignment: "right"},
    { name: 'Volume', color: 'green', alignment: "right"},
    { name: 'Counterparties Count', color: 'green', alignment: "right"},
    { name: 'Age', color: 'green', alignment: "right"},
  ]
})

const apiUrl = "https://api.nomis.cc/api/v1/layerzero/wallet/"

let stats = []

async function getStats(wallet) {
    let isStatsReady = false
    while (!isStatsReady) {
        await axios.get(apiUrl+wallet+'/score', {
            params: {
                scoreType: '0',
                prepareToMint: 'true',
            },
            headers: {
                'X-Api-Key': 'ps1H5eqDhEvm799azsEwMgplTZW5rhXm',
                'X-Clientid': '01c4b509-4990-44c0-b9dc-a09dcb0bab5f'
            }
        }).then(response => {
            // console.log(response.data.data.stats)
            stats[wallet].score = response.data.data.score
            stats[wallet].transactions = response.data.data.stats.totalTransactions
            stats[wallet].transfers = response.data.data.stats.totalCounterpartiesTransfers
            stats[wallet].nft_transfers = response.data.data.stats.totalCounterpartiesNFTTransfers
            stats[wallet].volume = response.data.data.stats.totalCounterpartiesTurnoverUSD
            stats[wallet].age = response.data.data.stats.walletAge
            stats[wallet].counterparties_count = response.data.data.stats.totalCounterpartiesUsed
            isStatsReady = true
        }).catch(async function (e) {
            await sleep(5 * 1000)
        })
    }
}

const wallets = readWallets('./addresses/layerzero.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progressBar.start(iterations, 0)

for (let wallet of wallets) {
    stats[wallet] = {
        balances: []
    }

    await getStats(wallet)
    progressBar.update(iteration)
    await sleep(1.5 * 1000)

    let row
    if (stats[wallet].score) {
        row = {
            n: iteration,
            wallet: wallet,
            'Score': stats[wallet].score.toFixed(2).replace('0.', ''),
            'Transactions': stats[wallet].transactions,
            'Transfers': stats[wallet].transfers,
            'NFT Transfers': stats[wallet].nft_transfers,
            'Volume': '$'+stats[wallet].volume.toFixed(),
            'Counterparties Count': stats[wallet].counterparties_count,
            'Age': stats[wallet].age
        }

        p.addRow(row)
    }

    iteration++

    if (!--iterations) {
        progressBar.stop()

        p.printTable()

        p.table.rows.map((row) => {
            csvData.push(row.text)
        })

        csvWriter.writeRecords(csvData)
            .then(() => console.log('Запись в CSV файл завершена'))
            .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error))
    }
}