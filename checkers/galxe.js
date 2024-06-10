import '../utils/common.js'
import { getProxy, readWallets } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'GalxePoints', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'GalxePoints', title: 'GalxePoints' },
]

const args = process.argv.slice(2)

let space = ''
if (args[1]) {
    space = args[1]
}

let stats = []
let csvData = []
let jsonData
let p
let csvWriter
let wallets = readWallets(config.modules.galxe.addresses)
let iterations = wallets.length
let iteration = 1
let totalPoints = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function getPoints(wallet, index) {
    let agent = getProxy(index, true)
    await axios.post('https://graphigo.prd.galaxy.eco/query', {
        operationName: 'SpaceAccessQuery',
        variables: {
            alias: space,
            address: wallet.toLowerCase(),
        },
        query: 'query SpaceAccessQuery($id: Int, $alias: String, $address: String!) {\n  space(id: $id, alias: $alias) {\n    id\n    isFollowing\n    discordGuildID\n    discordGuildInfo\n    status\n    isAdmin(address: $address)\n    unclaimedBackfillLoyaltyPoints(address: $address)\n    addressLoyaltyPoints(address: $address) {\n      id\n      points\n      rank\n      __typename\n    }\n    __typename\n  }\n}\n',
    }, {
        httpsAgent: agent,
        headers: {
            'authority': 'graphigo.prd.galaxy.eco',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://galxe.com',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
    }).then(response => {
        stats[wallet].galxepoints = response.data.data.space ? response.data.data.space.addressLoyaltyPoints.points : null
    }).catch(error => {
        if (config.debug) console.log(error.toString())
    })
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        galxepoints: 0,
    }

    await getPoints(wallet, index)
    progressBar.update(iteration)

    let row = {
        n: parseInt(index)+1,
        wallet: wallet,
        'GalxePoints': stats[wallet].galxepoints
    }

    jsonData.push({
        n: parseInt(index)+1,
        wallet: wallet,
        'GalxePoints': stats[wallet].galxepoints
    })

    totalPoints += stats[wallet].galxepoints
    p.addRow(row)
    iteration++
}

function fetchWallets() {
    wallets = readWallets(config.modules.galxe.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []
    totalPoints = 0

    csvWriter = createObjectCsvWriter({
        path: `./results/galxe_${space}.csv`,
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const walletPromises = wallets.map((account, index) => fetchWallet(account, index))
    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function galxeFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()

    p.addRow({
        wallet: 'Total',
        'GalxePoints': totalPoints,
    })

    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function galxeData(activeSpace) {
    space = activeSpace
    await fetchWallets()

    jsonData.push({
        wallet: 'Total',
        'GalxePoints': totalPoints
    })

    return jsonData
}