import { chooiceNetwork, compareVersions, entryPoint, evmNetwork, sleep } from "./utils/common.js"
import { zkSyncFetchDataAndPrintTable } from "./checkers/zksync.js"
import { aptosFetchDataAndPrintTable } from "./checkers/aptos.js"
import { zoraFetchDataAndPrintTable } from "./checkers/zora.js"
import { lineaFetchDataAndPrintTable } from "./checkers/linea.js"
import { scrollFetchDataAndPrintTable } from "./checkers/scroll.js"
import { balancesFetchDataAndPrintTable } from "./checkers/balances.js"
import { evmFetchDataAndPrintTable } from "./checkers/evm.js"
import { filterFetchDataAndPrintTable } from "./checkers/filter.js"
import { nftFetchDataAndPrintTable } from "./checkers/nft.js"
import { layerzeroFetchDataAndPrintTable } from "./checkers/layerzero.js"
import { baseFetchDataAndPrintTable } from "./checkers/base.js"
import { wormholeFetchDataAndPrintTable } from "./checkers/wormhole.js"
import { zkbridgeFetchDataAndPrintTable } from "./checkers/zkbridge.js"
import { hyperlaneFetchDataAndPrintTable } from "./checkers/hyperlane.js"
import { exec } from "child_process"
import fs from "fs"
import axios from "axios"
import { clustersFetchDataAndPrintTable } from "./checkers/clusters.js"
import { debridgeFetchDataAndPrintTable } from "./checkers/debridge.js"

function startExpressServer() {
    const expressServer = exec('node server.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`[Express Server Error]: ${error}`)
        }
        console.log(`[Express Server]: ${stdout}`)
    })

    expressServer.stdout.on('data', (data) => {
        console.log(`[Express Server]: ${data}`)
    })

    expressServer.stderr.on('data', (data) => {
        console.error(`[Express Server Error]: ${data}`)
    })
}

async function checkVersion() {
    fs.readFile('./package.json', 'utf8', async (err, content) => {
        if (err) {
            console.error('Error reading file:', err)
            return
        }
        const packageInfo = JSON.parse(content)
        let actualVersion = 0

        await axios.get('https://munris.tech/checker-version.json').then(response => {
            actualVersion = response.data
        })

        if (compareVersions(actualVersion, packageInfo.version)) {
            console.log('\x1b[31m', `Your version of Wallet checker is out of date. Please update it before use.`)
            console.log('\x1b[31m', `Actual: ${actualVersion} Local: ${packageInfo.version}`)
            console.log('\x1b[0m')
            await sleep(5000)
        }
    })
}

async function startMenu(menu) {
    
    await checkVersion()
    await sleep(1000)

    let startOver = true
    if (menu === undefined) {
        mode = await entryPoint()
    } else {
        startOver = false
    }

    switch (mode) {
        case "web":
            startExpressServer()
            break
        case "clusters":
            await clustersFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "zksync":
            await zkSyncFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "debridge":
            await debridgeFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "wormhole":
            await wormholeFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "zkbridge":
            await zkbridgeFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "hyperlane":
            await hyperlaneFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "layerzero":
            await layerzeroFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "layerzero_extended":
            await layerzeroFetchDataAndPrintTable(true).catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "zora":
            await zoraFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "base":
            await baseFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "aptos":
            await aptosFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "linea":
            await lineaFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "scroll":
            await scrollFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "evm":
            let chain = await evmNetwork()
            await evmFetchDataAndPrintTable(chain).catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "balances":
            let network = await chooiceNetwork()
            await balancesFetchDataAndPrintTable(network).catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "filter":
            await filterFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
        case "nft":
            await nftFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error) })
            if (startOver) await startMenu()
            break
    }
}

const args = process.argv.slice(2)
let mode = args[0]

if (mode === 'web') {
    startExpressServer()
} else {
    await startMenu(mode)
}
