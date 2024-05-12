import { getKeyByValue, newAbortSignal, readWallets, getProxy } from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import cliProgress from 'cli-progress'
import { config } from '../_user_data/config.js'

const columns = [
    { name: 'n', color: 'green', alignment: "right" },
    { name: 'Wallet', color: 'green', alignment: "right" },
    { name: 'PoH', color: 'green', alignment: "right" },
    { name: 'A / Gitcoin', color: 'green', alignment: "right" },
    { name: 'A / PADO', color: 'green', alignment: "right" },
    { name: 'A / Trusta', color: 'green', alignment: "right" },
    { name: 'A / Testnet Voyage', color: 'green', alignment: "right" },
    { name: 'A / Coinbase', color: 'green', alignment: "right" },
    { name: 'A / OKX', color: 'green', alignment: "right" },
    { name: 'A / Uber', color: 'green', alignment: "right" },
    { name: 'B / Clique', color: 'green', alignment: "right" },
    { name: 'B / Openid', color: 'green', alignment: "right" },
    { name: 'B / Nomis', color: 'green', alignment: "right" },
    { name: 'B / Orange', color: 'green', alignment: "right" },
    { name: 'B / Ruby', color: 'green', alignment: "right" },
    { name: 'B / Trusta', color: 'green', alignment: "right" },
    { name: 'B / 0xScore', color: 'green', alignment: "right" },
]

const headers = [
    { id: 'n', title: '№' },
    { id: 'Wallet', title: 'Wallet' },
    { id: 'PoH', title: 'PoH' },
    { id: 'A / Gitcoin', title: 'A / Gitcoin'},
    { id: 'A / PADO', title: 'A / PADO'},
    { id: 'A / Trusta', title: 'A / Trusta'},
    { id: 'A / Testnet Voyage', title: 'A / Testnet Voyage'},
    { id: 'A / Coinbase', title: 'A / Coinbase'},
    { id: 'A / OKX', title: 'A / OKX'},
    { id: 'A / Uber', title: 'A / Uber'},
    { id: 'B / Clique', title: 'B / Clique'},
    { id: 'B / Openid', title: 'B / Openid'},
    { id: 'B / Nomis', title: 'B / Nomis'},
    { id: 'B / Orange', title: 'B / Orange'},
    { id: 'B / Ruby', title: 'B / Ruby'},
    { id: 'B / Trusta', title: 'B / Trusta'},
    { id: 'B / 0xScore', title: 'B / 0xScore'},
]

let p
let csvWriter
let wallets = readWallets(config.modules.linea.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

async function fetchWallet(wallet, index) {
    let data = {
        wallet: wallet,
        'PoH': false,
        'A / Gitcoin': false,
        'A / PADO': false,
        'A / Trusta': false,
        'A / Testnet Voyage': false,
        'A / Coinbase': false,
        'A / OKX': false,
        'A / Uber': false,
        'B / Clique': false,
        'B / Openid': false,
        'B / Nomis': false,
        'B / Orange': false,
        'B / Ruby': false,
        'B / Trusta': false,
        'B / 0xScore': false,
    }

    let pohDone
    let pohRetry = 0

    while (!pohDone) {
        await axios.get(`https://linea-xp-poh-api.linea.build/poh/${wallet}`, {
            signal: newAbortSignal(5000),
            httpsAgent: getProxy(0, true),
        }).then(response => {
            data['PoH'] = response.data.poh
            data['A / Gitcoin'] = response.data.attestations.find(issuer => issuer.issuerName === 'Gitcoin Passport').validated
            data['A / PADO'] = response.data.attestations.find(issuer => issuer.issuerName === 'PADO Labs').validated
            data['A / Trusta'] = response.data.attestations.find(issuer => issuer.issuerName === 'Trusta POH Attestation').validated
            data['A / Testnet Voyage'] = response.data.attestations.find(issuer => issuer.issuerName === 'Testnet Voyage NFT original recipient').validated
            data['A / Coinbase'] = response.data.attestations.find(issuer => issuer.issuerName === 'zkPass - Coinbase KYC').validated
            data['A / OKX'] = response.data.attestations.find(issuer => issuer.issuerName === 'zkPass - OKX KYC').validated
            data['A / Uber'] = response.data.attestations.find(issuer => issuer.issuerName === 'zkPass - Uber trips').validated
            data['B / Clique'] = response.data.attestations.find(issuer => issuer.issuerName === 'Clique').validated
            data['B / Openid'] = response.data.attestations.find(issuer => issuer.issuerName === 'Openid3').validated
            data['B / Nomis'] = response.data.attestations.find(issuer => issuer.issuerName === 'Nomis').validated
            data['B / Orange'] = response.data.attestations.find(issuer => issuer.issuerName === 'Orange Protocol').validated
            data['B / Ruby'] = response.data.attestations.find(issuer => issuer.issuerName === 'RubyScore').validated
            data['B / Trusta'] = response.data.attestations.find(issuer => issuer.issuerName === 'Trusta Reputation Attestation').validated
            data['B / 0xScore'] = response.data.attestations.find(issuer => issuer.issuerName === '0xScore').validated
            pohDone = true
        }).catch(function (error) {
            if (config.debug) console.log(error)

            pohRetry++
            if (pohRetry > 3) {
                pohDone = true
            }
        })
    }

    progressBar.update(iteration)

    let row = {
        n: parseInt(index) + 1,
        Wallet: wallet,
        'PoH': data['PoH'],
        'A / Gitcoin': data['A / Gitcoin'],
        'A / PADO': data['A / PADO'],
        'A / Trusta': data['A / Trusta'],
        'A / Testnet Voyage': data['A / Testnet Voyage'],
        'A / Coinbase': data['A / Coinbase'],
        'A / OKX': data['A / OKX'],
        'A / Uber': data['A / Uber'],
        'B / Clique': data['B / Clique'],
        'B / Openid': data['B / Openid'],
        'B / Nomis': data['B / Nomis'],
        'B / Orange': data['B / Orange'],
        'B / Ruby': data['B / Ruby'],
        'B / Trusta': data['B / Trusta'],
        'B / 0xScore': data['B / 0xScore'],
    }

    p.addRow(row)

    iteration++
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

function fetchWallets() {
    wallets = readWallets(config.modules.linea.addresses)
    iterations = wallets.length
    iteration = 1
    csvData = []

    csvWriter = createObjectCsvWriter({
        path: './results/linea-poh.csv',
        header: headers
    })

    const batchSize = 30
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

export async function pohFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)

    await fetchWallets()
    progressBar.stop()

    p.printTable()

    await saveToCsv()
}
