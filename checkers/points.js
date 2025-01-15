import Moralis from "moralis"
import {readWallets, getKeyByValue, getProxy} from '../utils/common.js'
import {Table} from "console-table-printer"
import cliProgress from "cli-progress"
import {createObjectCsvWriter} from "csv-writer"
import { config } from '../user_data/config.js'
import axios from "axios"
import { cleanByChecker, getWalletFromDB, saveWalletToDB } from "../utils/db.js"

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'points', alignment: "right", color: 'cyan' },
]

const headers = [
    {id: 'n', title: 'n'},
    {id: 'wallet', title: 'wallet'},
    {id: 'points', title: 'points'},
]

let total = 0
let isJson = false
let p
let csvWriter
let wallets = []
let jsonData = []
let csvData = []
let stats = []
let iteration = 1
let iterations = 1
let progressBar

async function zerion(wallet) {
    let isFetched = false
    let retries = 0

    stats[wallet].xp = 0

    while (!isFetched) {
        await axios.get(`https://dna.zerion.io/api/v1/leaders/${wallet}`, {
            timeout: 5000,
            httpsAgent: getProxy()
        }).then(async response => {
            stats[wallet].points = response.data.earnedXP ? parseInt(response.data.earnedXP) : 0
            stats[wallet].position = response.data.position ? parseInt(response.data.position) : 0
            total += parseInt(stats[wallet].xp)
            isFetched = true
        }).catch(e => {
            if (config.debug) console.log('zerion', e.toString())

            retries++

            if (retries >= 3) {
                isFetched = true
            }
        })
    }
}

async function fetchWallet(wallet, index, project, isFetch = false) {

    const existingData = await getWalletFromDB(wallet, project)
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            points: 0,
        }

        if (project === 'zerion') {
            await zerion(wallet)
        }
    }

    p.addRow({
        'n': parseInt(index)+1,
        'wallet': wallet,
        'points': stats[wallet].points
    })

    jsonData.push({
        'n': parseInt(index)+1,
        'wallet': wallet,
        'points': stats[wallet].points
    })

    if (!isJson) {
        progressBar.update(iteration++)
    }

    if (stats[wallet].points > 0) {
        await saveWalletToDB(wallet, project, JSON.stringify(stats[wallet]))
    }
}

async function fetchBatch(batch, project) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), project)))
}

async function fetchWallets(project) {
    wallets = readWallets(config.modules.points.projects[project].addresses)
    jsonData = []
    iteration = 1
    total = 0

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    csvWriter = createObjectCsvWriter({
        path: `./results/points_${project}.csv`,
        header: headers
    })

    let batchSize = 10
    let timeout = 1000

    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch, project))
            }, i * timeout)
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
}

async function addTotalRow() {
    total = total / Math.pow(10, 18) 
    p.addRow({
        'Wallet': 'Total',
        'points': total,
    })
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function pointsFetchDataAndPrintTable(project) {
    wallets = readWallets(config.modules.points.projects[project].addresses)
    iterations = wallets.length
    progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
    progressBar.start(iterations, 0)
    
    await fetchWallets(project)
    await addTotalRow(project)
    await saveToCsv()

    if (!isJson) {
        progressBar.stop()
        p.printTable()
    }
}

export async function pointsData(project) {
    isJson = true
    await fetchWallets(project)
    await addTotalRow()
    
    jsonData.push({
        'wallet': 'Total',
        'points': total,
    })

    return jsonData
}

export async function pointsFetchWallet(wallet, project) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), project, true)
}

export async function pointsClean(project) {
    await cleanByChecker(project)
}