import Moralis from "moralis"
import {readWallets, getKeyByValue, getProxy} from '../utils/common.js'
import {Table} from "console-table-printer"
import cliProgress from "cli-progress"
import {createObjectCsvWriter} from "csv-writer"
import { config } from '../user_data/config.js'
import axios from "axios"
import { getWalletFromDB, saveWalletToDB } from "../utils/db.js"

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'airdrop', alignment: "right", color: 'cyan' },
]


const headers = [
    {id: 'n', title: 'n'},
    {id: 'wallet', title: 'wallet'},
    {id: 'airdrop', title: 'airdrop'},
]

let total = 0
let isJson = false
let p
let csvWriter
let jsonData = []
let csvData = []
let stats = []
let wallets = []
let iteration = 1
let iterations = 1
let progressBar

async function jupiter(wallet) {
    let isFetched = false
    let retries = 0

    stats[wallet].airdrop = 0

    while (!isFetched) {
        await axios.get(`https://jupuary.jup.ag/api/allocation?wallet=${wallet}`, {
            timeout: 5000,
            httpsAgent: getProxy(),
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "cookie": "",
                "Referer": `https://jupuary.jup.ag/allocation/${wallet}`,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        }).then(async response => {
            stats[wallet].airdrop = response.data.data ? response.data.data.total_allocated ? parseInt(response.data.data.total_allocated) : 0 : 0
            total += parseInt(stats[wallet].airdrop)
            isFetched = true
        }).catch(e => {
            if (config.debug) console.log('jupiter', e.toString())

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
        total += stats[wallet].airdrop
    } else {
        stats[wallet] = {
            airdrop: 0,
        }

        if (project === 'jupiter') {
            await jupiter(wallet)
        }
    }

    p.addRow({
        'n': parseInt(index)+1,
        'wallet': wallet,
        'airdrop': stats[wallet].airdrop
    })

    jsonData.push({
        'n': parseInt(index)+1,
        'wallet': wallet,
        'airdrop': stats[wallet].airdrop
    })

    if (!isJson) {
        progressBar.update(iteration++)
    }

    if (stats[wallet].airdrop > 0) {
        await saveWalletToDB(wallet, project, JSON.stringify(stats[wallet]))
    }
}

async function fetchBatch(batch, project) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account), project)))
}

async function fetchWallets(project) {
    wallets = readWallets(config.modules.airdrop.projects[project].addresses)
    jsonData = []
    iteration = 1
    total = 0

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    csvWriter = createObjectCsvWriter({
        path: `./results/airdrop_${project}.csv`,
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
    // total = total / Math.pow(10, 18) 
    p.addRow({
        'wallet': 'Total',
        'airdrop': total,
    })
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function airdropFetchDataAndPrintTable(project) {
    wallets = readWallets(config.modules.airdrop.projects[project].addresses)
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

export async function airdropData(project) {
    isJson = true
    await fetchWallets(project)
    await addTotalRow(project)

    jsonData.push({
        'wallet': 'Total',
        'airdrop': total,
    })

    return jsonData
}

export async function airdropFetchWallet(wallet, project) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), project, true)
}

export async function airdropClean(project) {
    await cleanByChecker(project)
}