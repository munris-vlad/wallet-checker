import '../utils/common.js'
import {
    sleep,
    readWallets,
    getBalance,
    getKeyByValue,
    getProxy,
    newAbortSignal,
    ethPrice,
    timestampToDate
} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { config } from '../user_data/config.js'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import { formatEther, parseEther } from 'viem'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'wallet', color: 'green', alignment: "right" },
    { name: 'IP', alignment: 'right', color: 'cyan' },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    { name: 'Badge Count', alignment: 'right', color: 'cyan' },
    { name: 'Main', alignment: 'right', color: 'cyan' },
    { name: 'OKX', alignment: 'right', color: 'cyan' },
    { name: 'StoryHunt', alignment: 'right', color: 'cyan' },
    { name: 'Verio', alignment: 'right', color: 'cyan' },
    { name: 'Styreal', alignment: 'right', color: 'cyan' },
    { name: 'Wand', alignment: 'right', color: 'cyan' },
    { name: 'Poster', alignment: 'right', color: 'cyan' },
    { name: 'Solo', alignment: 'right', color: 'cyan' },
    { name: 'Satori', alignment: 'right', color: 'cyan' },
    { name: 'MahojinIP', alignment: 'right', color: 'cyan' },
    { name: 'StandartProtocol', alignment: 'right', color: 'cyan' },
    { name: 'BlockBook', alignment: 'right', color: 'cyan' },
    { name: 'D3X', alignment: 'right', color: 'cyan' },
    { name: 'Impossible', alignment: 'right', color: 'cyan' },
    { name: 'Combo', alignment: 'right', color: 'cyan' },
    { name: 'Color', alignment: 'right', color: 'cyan' },
    { name: 'Unleash', alignment: 'right', color: 'cyan' },
    { name: 'Nightly', alignment: 'right', color: 'cyan' },
    { name: 'ArtStory', alignment: 'right', color: 'cyan' },
    { name: 'PunkgaMe', alignment: 'right', color: 'cyan' },
    { name: 'Rightsfually', alignment: 'right', color: 'cyan' },
    { name: 'PiperX', alignment: 'right', color: 'cyan' },
    { name: 'Spotlight', alignment: 'right', color: 'cyan' },
    { name: 'Playarts', alignment: 'right', color: 'cyan' },
    { name: 'Contracts', alignment: 'right', color: 'cyan' },
    { name: 'Singular', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First tx', alignment: 'right', color: 'cyan' },
    { name: 'Last tx', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'wallet', title: 'wallet' },
    { id: 'IP', title: 'IP' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Badge Count', title: 'TX Count' },
    { id: 'Main', title: 'Main' },
    { id: 'OKX', title: 'OKX' },
    { id: 'StoryHunt', title: 'StoryHunt' },
    { id: 'Verio', title: 'Verio' },
    { id: 'Styreal', title: 'Styreal' },
    { id: 'Wand', title: 'Wand' },
    { id: 'Poster', title: 'Poster' },
    { id: 'Solo', title: 'Solo' },
    { id: 'Satori', title: 'Satori' },
    { id: 'MahojinIP', title: 'MahojinIP' },
    { id: 'StandartProtocol', title: 'StandartProtocol' },
    { id: 'BlockBook', title: 'BlockBook' },
    { id: 'D3X', title: 'D3X' },
    { id: 'Impossible', title: 'Impossible' },
    { id: 'Combo', title: 'Combo' },
    { id: 'Color', title: 'Color' },
    { id: 'Unleash', title: 'Unleash' },
    { id: 'Nightly', title: 'Nightly' },
    { id: 'ArtStory', title: 'ArtStory' },
    { id: 'PunkgaMe', title: 'PunkgaMe' },
    { id: 'Rightsfually', title: 'Rightsfually' },
    { id: 'PiperX', title: 'PiperX' },
    { id: 'Spotlight', title: 'Spotlight' },
    { id: 'Playarts', title: 'Playarts' },
    { id: 'Singular', title: 'Singular' },
    { id: 'Contracts', title: 'Contracts' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First tx', title: 'First tx' },
    { id: 'Last tx', title: 'Last tx' },
]

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('story')
}

let p
let csvWriter
let stats = []
let wallets = readWallets(config.modules.story.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let jsonData = []
let apiUrl = 'https://odyssey.storyscan.xyz/api/v2/addresses'
const cancelTimeout = 15000
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const reqHeaders = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referer": "https://odyssey.storyscan.xyz/address/0x2300f68064BfaafA381cd36f2695CDfEAAc09231?tab=txs",
    "Referrer-Policy": "origin-when-cross-origin"
}

async function getBalances(wallet) {
    let ipBalanceDone
    let ipBalanceRetry = 0

    let badgeBalanceDone
    let badgeBalanceRetry = 0

    while (!ipBalanceDone) {
        await axios.get(`${apiUrl}/${wallet}`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            stats[wallet].balances['IP'] = formatEther(parseEther(response.data.coin_balance)) / Math.pow(10, 18)
            ipBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)
            ipBalanceRetry++
            if (ipBalanceRetry > 3) {
                ipBalanceDone = true
            }
        })
    }

    while (!badgeBalanceDone) {
        await axios.get(`${apiUrl}/${wallet}/tokens?type=ERC-721`, {
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
        }).then(async response => {
            const tokens = response.data.items
            for (const token of tokens) {
                stats[wallet].balances[token.token.symbol] = 1
            }
            badgeBalanceDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            badgeBalanceRetry++
            if (badgeBalanceRetry > 3) {
                badgeBalanceDone = true
            }
        })
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let txs = []
    let params = {
        block_number: '',
        index: '',
        items_count: ''
    }
    let isAllTxCollected = false, retry = 0

    while (!isAllTxCollected && retry < 3) {
        await axios.get(`${apiUrl}/${wallet}/transactions`, {
            params: params.block_number === '' ? {} : params,
            signal: newAbortSignal(cancelTimeout),
            httpsAgent: getProxy(0, true),
            headers: reqHeaders
        }).then(async response => {
            let items = response.data.items

            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (response.data.next_page_params === null) {
                isAllTxCollected = true
            } else {
                params = response.data.next_page_params
            }
        }).catch(function (error) {
            if (config.debug) console.log(error)

            retry++
        })
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(tx.timestamp)
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())

        if (tx.from) {
            if (tx.from.hash.toLowerCase() === wallet.toLowerCase()) {
                if (tx.to) {
                    uniqueContracts.add(tx.to.hash)
                }
            }
        }
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size
    const numUniqueContracts = uniqueContracts.size
    if (txs.length) {
        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].timestamp)
        stats[wallet].last_tx_date = new Date(txs[0].timestamp)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
    }
}

async function fetchWallet(wallet, index, isFetch = false) {
    const existingData = await getWalletFromDB(wallet, 'story')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            txcount: 0,
            badgecount: 0,
            balances: { IP: 0 },
        }

        await getBalances(wallet)
        await getTxs(wallet)
    }

    let badgeCount = 0

    badgeCount += stats[wallet].balances['OTCIPA'] ? 1 : 0
    badgeCount += stats[wallet].balances['WAND'] ? 1 : 0
    badgeCount += stats[wallet].balances['SOLOXSSB'] ? 1 : 0
    badgeCount += stats[wallet].balances['COLB'] ? 1 : 0
    badgeCount += stats[wallet].balances['UPB'] ? 1 : 0
    badgeCount += stats[wallet].balances['NIGHTLY'] ? 1 : 0
    badgeCount += stats[wallet].balances['D3XBadge'] ? 1 : 0
    badgeCount += stats[wallet].balances['SatoriBadge'] ? 1 : 0
    badgeCount += stats[wallet].balances['$MahojinIPBadge'] ? 1 : 0
    badgeCount += stats[wallet].balances['PunkgaMeBadge'] ? 1 : 0
    badgeCount += stats[wallet].balances['STND-STORYBADGE'] ? 1 : 0
    badgeCount += stats[wallet].balances['rfally'] ? 1 : 0
    badgeCount += stats[wallet].balances['PIPERX'] ? 1 : 0
    badgeCount += stats[wallet].balances['IF'] ? 1 : 0
    badgeCount += stats[wallet].balances['1CSB'] ? 1 : 0
    badgeCount += stats[wallet].balances['SPOT'] ? 1 : 0
    badgeCount += stats[wallet].balances['ARTSTORYBADGE'] ? 1 : 0
    badgeCount += stats[wallet].balances['SNGLR'] ? 1 : 0
    badgeCount += stats[wallet].balances['PSTR'] ? 1 : 0
    badgeCount += stats[wallet].balances['okx_story_odyssey'] ? 1 : 0
    badgeCount += stats[wallet].balances['VERIO'] ? 1 : 0
    badgeCount += stats[wallet].balances['STYREALBadge'] ? 1 : 0
    badgeCount += stats[wallet].balances['SHB'] ? 1 : 0
    badgeCount += stats[wallet].balances['BlockBook'] ? 1 : 0

    stats[wallet].badgecount = badgeCount
    progressBar.update(iteration)

    p.addRow({
        n: parseInt(index) + 1,
        wallet: wallet,
        'IP': parseFloat(stats[wallet].balances['IP']).toFixed(4),
        'TX Count': stats[wallet].txcount,
        'Badge Count': stats[wallet].badgecount,
        'Main': stats[wallet].balances['OTCIPA'] ? 'Yes' : 'No',
        'Community': stats[wallet].balances['CIPCNFT'] ? 'Yes' : 'No',
        'OKX': stats[wallet].balances['okx_story_odyssey'] ? 'Yes' : 'No',
        'StoryHunt': stats[wallet].balances['SHB'] ? 'Yes' : 'No',
        'Verio': stats[wallet].balances['VERIO'] ? 'Yes' : 'No',
        'Styreal': stats[wallet].balances['STYREALBadge'] ? 'Yes' : 'No',
        'Wand': stats[wallet].balances['WAND'] ? 'Yes' : 'No',
        'Poster': stats[wallet].balances['PSTR'] ? 'Yes' : 'No',
        'Solo': stats[wallet].balances['SOLOXSSB'] ? 'Yes' : 'No',
        'Color': stats[wallet].balances['COLB'] ? 'Yes' : 'No',
        'Unleash': stats[wallet].balances['UPB'] ? 'Yes' : 'No',
        'Nightly': stats[wallet].balances['NIGHTLY'] ? 'Yes' : 'No',
        'D3X': stats[wallet].balances['D3XBadge'] ? 'Yes' : 'No',
        'Impossible': stats[wallet].balances['IF'] ? 'Yes' : 'No',
        'Combo': stats[wallet].balances['1CSB'] ? 'Yes' : 'No',
        'Satori': stats[wallet].balances['SatoriBadge'] ? 'Yes' : 'No',
        'MahojinIP': stats[wallet].balances['$MahojinIPBadge'] ? 'Yes' : 'No',
        'ArtStory': stats[wallet].balances['ARTSTORYBADGE'] ? 'Yes' : 'No',
        'PunkgaMe': stats[wallet].balances['PunkgaMeBadge'] ? 'Yes' : 'No',
        'StandartProtocol': stats[wallet].balances['STND-STORYBADGE'] ? 'Yes' : 'No',
        'BlockBook': stats[wallet].balances['BlockBook'] ? 'Yes' : 'No',
        'Rightsfually': stats[wallet].balances['rfally'] ? 'Yes' : 'No',
        'PiperX': stats[wallet].balances['PIPERX'] ? 'Yes' : 'No',
        'Spotlight': stats[wallet].balances['SPOT'] ? 'Yes' : 'No',
        'Singular': stats[wallet].balances['SNGLR'] ? 'Yes' : 'No',
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '-',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '-',
    })

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        'IP': parseFloat(stats[wallet].balances['IP']).toFixed(4),
        'TX Count': stats[wallet].txcount,
        'Badge Count': stats[wallet].badgecount,
        'Main': stats[wallet].balances['OTCIPA'] ? 1 : 0,
        'Community': stats[wallet].balances['CIPCNFT'] ? 1 : 0,
        'OKX': stats[wallet].balances['okx_story_odyssey'] ? 1 : 0,
        'StoryHunt': stats[wallet].balances['SHB'] ? 1 : 0,
        'Verio': stats[wallet].balances['VERIO'] ? 1 : 0,
        'Styreal': stats[wallet].balances['STYREALBadge'] ? 1 : 0,
        'Wand': stats[wallet].balances['WAND'] ? 1 : 0,
        'Poster': stats[wallet].balances['PSTR'] ? 1 : 0,
        'Solo': stats[wallet].balances['SOLOXSSB'] ? 1 : 0,
        'Color': stats[wallet].balances['COLB'] ? 1 : 0,
        'Unleash': stats[wallet].balances['UPB'] ? 1 : 0,
        'Nightly': stats[wallet].balances['NIGHTLY'] ? 1 : 0,
        'D3X': stats[wallet].balances['D3XBadge'] ? 1 : 0,
        'Impossible': stats[wallet].balances['IF'] ? 1 : 0,
        'Combo': stats[wallet].balances['1CSB'] ? 1 : 0,
        'Satori': stats[wallet].balances['SatoriBadge'] ? 1 : 0,
        'MahojinIP': stats[wallet].balances['$MahojinIPBadge'] ? 1 : 0,
        'ArtStory': stats[wallet].balances['ARTSTORYBADGE'] ? 1 : 0,
        'PunkgaMe': stats[wallet].balances['PunkgaMeBadge'] ? 1 : 0,
        'StandartProtocol': stats[wallet].balances['STND-STORYBADGE'] ? 1 : 0,
        'BlockBook': stats[wallet].balances['BlockBook'] ? 1 : 0,
        'Rightsfually': stats[wallet].balances['rfally'] ? 1 : 0,
        'PiperX': stats[wallet].balances['PIPERX'] ? 1 : 0,
        'Spotlight': stats[wallet].balances['SPOT'] ? 1 : 0,
        'Singular': stats[wallet].balances['SNGLR'] ? 1 : 0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
    })

    if (stats[wallet].txcount > 0) {
        await saveWalletToDB(wallet, 'story', JSON.stringify(stats[wallet]))
    }

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.story.addresses)
    iterations = wallets.length
    csvData = []
    jsonData = []
    iteration = 1

    csvWriter = createObjectCsvWriter({
        path: './results/story.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    let batchSize = 10
    let timeout = 5000

    const walletsInDB = await getCountByChecker('story')

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

    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function storyFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function storyData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}

export async function storyFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function storyClean() {
    await cleanByChecker('story')
}