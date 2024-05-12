import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy, sortObjectByKey } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import fs from "fs"
import { config } from '../user_data/config.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Cluster', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'Total', color: 'green', alignment: "right" },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Cluster', title: 'Cluster' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'Total', title: 'Total' },
]


let jsonData = []
let p
let csvWriter
let wallets = readWallets(config.modules.clusters.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(walletData, index) {
    const [cluster, wallet] = walletData.split(":")
    let agent = getProxy(index)

    let data = {
        cluster: cluster,
        wallet: wallet,
        total: 0,
        tokens: []
    }

    let isTxParsed = false
    let retry = 0

    while (!isTxParsed) {
        await axios.get(`https://api.clusters.xyz/v0/portfolio/${cluster}/tokens`, {
            httpsAgent: agent,
            signal: newAbortSignal(40000)
        }).then(async response => {
            if (response.data) {
                data.total = parseInt(response.data.totalUsd)
                data.tokens = response.data.tokens
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
        Cluster: cluster,
        Wallet: wallet,
        Total: '$'+data.total
    }

    let jsonRow = {
        n: parseInt(index) + 1,
        Cluster: cluster,
        Wallet: wallet,
        Total: data.total,
        tokens: data.tokens
    }

    p.addRow(row)
    jsonData.push(jsonRow)

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchClusters() {
    let layerzeroWallets = readWallets(config.modules.layerzero.addresses)
    let clusters = []
    const file = fs.createWriteStream(config.modules.clusters.addresses)

    for (const layerzeroWallet of layerzeroWallets) {
        let isClustersParsed = false
        let retryClusters = 0
        let agent = getProxy(0, true)

        while (!isClustersParsed) {
            await axios.post(`https://api.clusters.xyz/v0.1/name/addresses`, [layerzeroWallet], {
                httpsAgent: agent,
                signal: newAbortSignal(15000)
            }).then(response => {
                let cluster = response.data[0].name ? response.data[0].name.replace('/main', '') : ''
                if (cluster.length) {
                    file.write(`${cluster}:${layerzeroWallet}\n`)
                }
                isClustersParsed = true
            }).catch(async error => {
                if (config.debug) console.error(layerzeroWallet, error.toString(), '| Get random proxy')
                retryClusters++

                agent = getProxy(0, true)
                await sleep(2000)
                if (retryClusters >= 3) {
                    isClustersParsed = true
                }
            })
        }
    }

    console.log(clusters)
}

async function fetchWallets() {
    wallets = readWallets(config.modules.clusters.addresses)
    if (!wallets.length) {
        await fetchClusters()
    }
    
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/clusters.csv',
        header: headers
    })

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

export async function clustersFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function clustersData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}