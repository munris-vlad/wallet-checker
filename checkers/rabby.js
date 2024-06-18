import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'Points', color: 'green', alignment: "right" },
    { name: 'Total', color: 'green', alignment: "right" },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'Points', title: 'Points' },
    { id: 'Total', title: 'Total' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('rabby')
}

let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.rabby.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = 0
let totalPoints = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index, isFetch = false) {
    let data
    const existingData = await getWalletFromDB(wallet, 'rabby')

    if (existingData && !isFetch) {
        data = JSON.parse(existingData)
    } else {
        let agent = getProxy(index, true)

        data = {
            wallet: wallet,
            total: 0,
            points: 0,
            chains: []
        }

        let isTxParsed = false
        let retry = 0

        let isPointsParsed = false
        let retryPoints = 0

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

        while (!isPointsParsed) {
            await axios.get(`https://api.rabby.io/v2/points/user?id=${wallet}`, {
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
                    data.points = parseInt(response.data.claimed_points)
                    isPointsParsed = true
                } else {
                    retry++

                    agent = getProxy(index, true)

                    if (retry >= 3) {
                        isPointsParsed = true
                    }

                    await sleep(1000)
                }
            }).catch(async error => {
                if (config.debug) console.error(wallet, error.toString(), '| Get random proxy')
                    retryPoints++

                agent = getProxy(index, true)

                if (retryPoints >= 3) {
                    isPointsParsed = true
                }

                await sleep(1000)
            })
        }
    }

    progressBar.update(iteration)

    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Total: '$' + data.total,
        Points: data.points
    }

    total += data.total
    totalPoints += data.points

    let jsonRow = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        Total: data.total,
        Points: data.points,
        chains: data.chains ? data.chains.sort((a, b) => b.usd_value - a.usd_value) : []
    }

    p.addRow(row)
    jsonData.push(jsonRow)

    await saveWalletToDB(wallet, 'rabby', JSON.stringify(data))

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
    totalPoints = 0

    csvWriter = createObjectCsvWriter({
        path: './results/rabby.csv',
        header: headers
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('rabby')

    if (walletsInDB === wallets.length) {
        batchSize = walletsInDB
        timeout = 0
    }

    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * timeout)
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
        Points: totalPoints,
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
        Points: totalPoints,
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

export async function rabbyFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function rabbyClean() {
    await cleanByChecker('rabby')
}