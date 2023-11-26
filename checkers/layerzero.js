import '../utils/common.js'
import { getKeyByValue, newAbortSignal, readWallets, sleep, timestampToDate, random, getProxy } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import moment from "moment"

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'TX Count', alignment: 'right', color: 'cyan' },
    // { name: 'Source chains count', alignment: 'right', color: 'cyan' },
    { name: 'Source chains', alignment: 'right', color: 'cyan' },
    // { name: 'Dest chains count', alignment: 'right', color: 'cyan' },
    { name: 'Dest chains', alignment: 'right', color: 'cyan' },
    { name: 'Contracts', alignment: 'right', color: 'cyan' },
    { name: 'Days', alignment: 'right', color: 'cyan' },
    { name: 'Weeks', alignment: 'right', color: 'cyan' },
    { name: 'Months', alignment: 'right', color: 'cyan' },
    { name: 'First TX', alignment: 'right', color: 'cyan' },
    { name: 'Last TX', alignment: 'right', color: 'cyan' },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'TX Count', title: 'TX Count' },
    { id: 'Source chains', title: 'Source chains' },
    { id: 'Dest chains', title: 'Dest chains' },
    { id: 'Contracts', title: 'Contracts' },
    { id: 'Days', title: 'Days' },
    { id: 'Weeks', title: 'Weeks' },
    { id: 'Months', title: 'Months' },
    { id: 'First TX', title: 'First TX' },
    { id: 'Last TX', title: 'Last TX' },
]

let jsonData = []
let p
let csvWriter
let wallets = readWallets('./addresses/layerzero.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function getQueryHeaders(wallet) {
    return {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,ru;q=0.8,bg;q=0.7',
        'baggage': 'sentry-environment=vercel-production,sentry-release=8b2b3e1a5f4040e5282f0c75f86e8efb01d3fd33,sentry-public_key=7ea9fec73d6d676df2ec73f61f6d88f0,sentry-trace_id=9120fe8b7ed94428851697ab60657409',
        'content-type': 'application/json',
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sentry-trace': '9120fe8b7ed94428851697ab60657409-b26417f0ca88871e-1',
        'cookie': '_ga=GA1.1.520004272.1700156268; _clck=cbqpar|2|fgr|0|1415; _clsk=1fu326x|1700157520972|18|1|t.clarity.ms/collect; _ga_1ZKFRJ8ERQ=GS1.1.1700156267.1.1.1700157521.0.0.0; _ga_3LWZVPQJTS=GS1.1.1700156268.1.1.1700157521.0.0.0',
        'Referer': `https://layerzeroscan.com/address/${wallet}`,
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
}

async function fetchWallet(wallet, index) {

    let agent = getProxy(index)

    let data = {
        wallet: wallet,
        tx_count: 0,
        source_chain_count: 0,
        source_chain: '',
        dest_chain_count: 0,
        dest_chain: '',
        contracts: 0,
        days: 0,
        weeks: 0,
        months: 0,
        first_tx: '',
        last_tx: ''
    }

    let txs = []
    let isTxParsed = false
    let retry = 0
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()
    const uniqueSource = new Set()
    const uniqueDestination = new Set()

    while (!isTxParsed) {
        await axios.get(`https://layerzeroscan.com/api/trpc/messages.list?input=${encodeURIComponent(`{"filters":{"address":"${wallet}","stage":"mainnet","created":{}}}`)}`, {
            headers: getQueryHeaders(),
            httpsAgent: agent,
            signal: newAbortSignal(5000)
        }).then(response => {
            txs = response.data.result.data.messages
            data.tx_count = response.data.result.data.count
            isTxParsed = true
        }).catch(error => {
            console.error(wallet, error.toString(), '| Get random proxy')
            retry++

            agent = getProxy(index, true)

            if (retry >= 3) {
                isTxParsed = true
            }
        })
    }
    

    if (txs.length) {

        for (const tx of Object.values(txs)) {
            const date = new Date(timestampToDate(tx.created))
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
            uniqueSource.add(tx.srcChainKey)
            uniqueDestination.add(tx.dstChainKey)
            uniqueContracts.add(tx.dstUaAddress)
        }

        data.first_tx = new Date(timestampToDate(txs[txs.length - 1].created))
        data.last_tx = new Date(timestampToDate(txs[0].created))
        data.source_chain_count = uniqueSource.size
        data.source_chain = Array.from(uniqueSource).join(', ')
        data.dest_chain_count = uniqueDestination.size
        data.dest_chain = Array.from(uniqueDestination).join(', ')
        data.contracts = uniqueContracts.size
        data.days = uniqueDays.size
        data.weeks = uniqueWeeks.size
        data.months = uniqueMonths.size
    }

    progressBar.update(iteration)

    p.addRow({
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Source chains': data.source_chain_count,
        // 'Source chains': data.source_chain,
        'Dest chains': data.dest_chain_count,
        // 'Dest chains': data.dest_chain,
        'Contracts': data.contracts,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.first_tx ? moment((data.first_tx)).format("DD.MM.YY") : '-',
        'Last TX': data.last_tx ? moment((data.last_tx)).format("DD.MM.YY") : '-',
    })

    jsonData.push({
        n: parseInt(index) + 1,
        Wallet: wallet,
        'TX Count': data.tx_count,
        'Source chains': data.source_chain_count,
        // 'Source chains': data.source_chain,
        'Dest chains': data.dest_chain_count,
        // 'Dest chains': data.dest_chain,
        'Contracts': data.contracts,
        'Days': data.days,
        'Weeks': data.weeks,
        'Months': data.months,
        'First TX': data.first_tx,
        'Last TX': data.last_tx,
    })

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

function fetchWallets() {
    wallets = readWallets('./addresses/layerzero.txt')
    iterations = wallets.length
    iteration = 1
    csvData = []
    jsonData = []

    csvWriter = createObjectCsvWriter({
        path: './results/layerzero.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
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

    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

export async function layerzeroFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}

export async function layerzeroData() {
    await fetchWallets()
    await saveToCsv()

    return jsonData
}