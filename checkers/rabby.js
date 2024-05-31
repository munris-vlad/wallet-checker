import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'Total', color: 'green', alignment: "right" },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'Total', title: 'Total' },
]


let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.rabby.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index) {
    let agent = getProxy(index, true)

    let data = {
        wallet: wallet,
        total: 0,
        chains: []
    }

    let isTxParsed = false
    let retry = 0

    while (!isTxParsed) {
        await axios.get(`https://api.rabby.io/v1/user/total_balance?id=${wallet}`, {
            httpsAgent: agent,
            signal: newAbortSignal(40000),
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "none",
                "x-client": "Rabby",
                "x-version": "0.92.72"
            }
        }).then(async response => {
            if (response.data) {
                data.total = parseInt(response.data.total_usd_value)
                data.chains = response.data.chain_list
                isTxParsed = true
            } else {
                retry++

                agent = getProxy(index, true)

                if (retry >= 3) {
                    isTxParsed = true
                }

                await sleep(1000)
            }
        }).catch(async error => {
            if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
            retry++

            agent = getProxy(index, true)

            if (retry >= 3) {
                isTxParsed = true
            }

            await sleep(1000)

        })
    }

    progressBar.update(iteration)

    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Total: '$' + data.total
    }

    total += data.total

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Total: data.total,
        chains: data.chains ? data.chains.sort((a, b) => b.usd_value - a.usd_value) : []
    }

    p.addRow(row)
    jsonData.push(jsonRow)

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.rabby.addresses)

    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []
    total = 0

    csvWriter = createObjectCsvWriter({
        path: './results/rabby.csv',
        header: headers
    })

    const batchSize = 10
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

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

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
        'Total': '$' + total
    })
}

export async function rabbyFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function rabbyData() {
    await fetchWallets()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'Total': total
    })

    return jsonData
}

export async function chainFetchData(wallet, chainId) {
    let agent = getProxy(0, true)
    let data
    let retry = 0
    let isSuccess = false
    while (!isSuccess) {
        await axios.get(`https://api.rabby.io/v1/user/token_list?id=${wallet.toLowerCase()}&is_all=true&chain_id=${chainId}`, {
            httpsAgent: agent,
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
                "priority": "u=1, i",
                "x-client": "Rabby",
                "x-version": "0.92.72"
            }
        }).then(response => {
            data = response.data.filter(item => item.is_core === true).sort((a, b) => (b.amount * b.price) - (a.amount * a.price))
            isSuccess = true
        }).catch(e => {
            if (config.debug) console.log(e.toString())
            agent = getProxy(0, true)
            retry++

            if (retry >= 3) {
                isSuccess = true
            }
        })
    }
    
    return data
}