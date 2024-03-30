import '../utils/common.js'
import { readWallets, getBalance, timestampToDate, getProxy, getTokenPrice } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import cloudscraper from 'cloudscraper'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'AptosName', alignment: 'right', color: 'cyan' },
    { name: 'GalxePoints', alignment: 'right', color: 'cyan' },
    { name: 'APT', alignment: 'right', color: 'cyan' },
    { name: 'USDC', alignment: 'right', color: 'cyan' },
    { name: 'USDT', alignment: 'right', color: 'cyan' },
    { name: 'DAI', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'AptosName', title: 'AptosName' },
    { id: 'GalxePoints', title: 'GalxePoints' },
    { id: 'APT', title: 'APT' },
    { id: 'USDC', title: 'USDC' },
    { id: 'USDT', title: 'USDT' },
    { id: 'DAI', title: 'DAI' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

const reqheaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
    "if-none-match": "W/\"451e-hvtWIYx9P6o5M2DHchFA2Z/RoGc\"",
    "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://tracemove.io/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

const apiUrl = "https://mainnet-aptos-api.nodereal.io/api"

const debug = false
let stats = []
let jsonData = []
let csvData = []
let p
let csvWriter
const filterSymbol = ['APT', 'USDT', 'USDC', 'DAI']
let wallets = readWallets('./addresses/aptos.txt')
let iterations = wallets.length
let iteration = 1
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
let aptPrice = await getTokenPrice('APT')

async function getBalances(wallet, index) {
    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })

    let config = {
        method: 'GET',
        url: apiUrl + `/account/${wallet}/coins`,
        timeout: 5000,
        headers: reqheaders
    }

    let isBalancesCollected = false
    let retry = 0

    while (!isBalancesCollected) {
        try {
            await cloudscraper(config).then(async response => {
                const data = JSON.parse(response)
                Object.values(data.data).forEach(balance => {
                    if (filterSymbol.includes(balance.symbol)) {
                        stats[wallet].balances[balance.symbol] = balance.amount
                    }
                })
                isBalancesCollected = true
            })
        } catch (e) {
            if (debug) console.log(e.toString())
            retry++

            if (retry > 3) {
                isBalancesCollected = true
            }
        }
    }

    try {
        await axios.get('https://www.aptosnames.com/api/mainnet/v1/name/' + wallet).then(response => {
            if (response.data) {
                stats[wallet].aptosname = response.data.name + '.apt'
            }
        })
    } catch (e) {
        if (debug) console.log(e.toString())
    }

    await axios.post('https://graphigo.prd.galaxy.eco/query', {
        operationName: 'SpaceAccessQuery',
        variables: {
            alias: 'aptos',
            address: wallet.toLowerCase(),
        },
        query: 'query SpaceAccessQuery($id: Int, $alias: String, $address: String!) {\n  space(id: $id, alias: $alias) {\n    id\n    isFollowing\n    discordGuildID\n    discordGuildInfo\n    status\n    isAdmin(address: $address)\n    unclaimedBackfillLoyaltyPoints(address: $address)\n    addressLoyaltyPoints(address: $address) {\n      id\n      points\n      rank\n      __typename\n    }\n    __typename\n  }\n}\n',
    }, {
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
        if (debug) console.log(error.toString())
    })
}

async function getTxs(wallet, index) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let totalGasUsed = 0
    let txs = []
    let isAllTxCollected = false
    let retry = 0

    let config = {
        method: 'GET',
        url: apiUrl + `/account/${wallet}/sendTx?page=0&pageSize=1000`,
        timeout: 5000,
        headers: reqheaders
    }

    while (!isAllTxCollected) {
        try {
            await cloudscraper(config).then(async response => {
                const data = JSON.parse(response)
                Object.values(data.data).forEach(tx => {
                    txs.push(tx)
                })
                isAllTxCollected = true
            })
        } catch (e) {
            if (debug) console.log(e.toString())
            retry++

            if (retry > 3) {
                isAllTxCollected = true
            }
        }
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(timestampToDate(tx.timestamp))
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(timestampToDate(txs[txs.length - 1].timestamp))
        stats[wallet].last_tx_date = new Date(timestampToDate(txs[0].timestamp))
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
    }
}

async function fetchWallet(wallet, index) {
    wallet = wallet.replace('0x0', '0x')

    stats[wallet] = {
        balances: [],
        aptosname: '-',
        galxepoints: 0
    }

    await getBalances(wallet, index)
    await getTxs(wallet, index)
    progressBar.update(iteration)
    let usdAptValue = (stats[wallet].balances['APT'] * aptPrice).toFixed(2)
    let row = {
        n: index,
        wallet: wallet,
        'AptosName': stats[wallet].aptosname ? stats[wallet].aptosname : '-',
        'GalxePoints': stats[wallet].galxepoints,
        'APT': stats[wallet].balances['APT'].toFixed(2) + ` ($${usdAptValue})`,
        'USDC': stats[wallet].balances['USDC'].toFixed(2),
        'USDT': stats[wallet].balances['USDT'].toFixed(2),
        'DAI': stats[wallet].balances['DAI'].toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Days': stats[wallet].unique_days,
        'Weeks': stats[wallet].unique_weeks,
        'Months': stats[wallet].unique_months,
        'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
        'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
    }

    p.addRow(row)
    jsonData.push({
        n: index,
        wallet: wallet,
        'AptosName': stats[wallet].aptosname ? stats[wallet].aptosname : '-',
        'GalxePoints': stats[wallet].galxepoints,
        'APT': stats[wallet].balances['APT'].toFixed(2),
        'APT USDVALUE': usdAptValue,
        'USDC': stats[wallet].balances['USDC'].toFixed(2),
        'USDT': stats[wallet].balances['USDT'].toFixed(2),
        'DAI': stats[wallet].balances['DAI'].toFixed(2),
        'TX Count': stats[wallet].txcount,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4) : 0,
    })

    iteration++
}

function fetchWallets() {
    wallets = readWallets('./addresses/aptos.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/aptos.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const walletPromises = wallets.map((account, index) => fetchWallet(account, index + 1))
    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function aptosFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function aptosData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}