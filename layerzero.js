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
        { id: 'score', title: 'score'},
    ]
})

const p = new Table({
  columns: [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'score', color: 'green', alignment: "right"},
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
            stats[wallet].score = response.data.data.score
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
            score: stats[wallet].score.toFixed(2)
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