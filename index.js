import {chooiceNetwork, entryPoint, evmNetwork} from "./utils/common.js"
import {zkSyncFetchDataAndPrintTable} from "./checkers/zksync.js"
import {aptosFetchDataAndPrintTable} from "./checkers/aptos.js"
import {starknetFetchDataAndPrintTable} from "./checkers/starknet.js"
import {zoraFetchDataAndPrintTable} from "./checkers/zora.js"
import {lineaFetchDataAndPrintTable} from "./checkers/linea.js"
import {scrollFetchDataAndPrintTable} from "./checkers/scroll.js"
import {balancesFetchDataAndPrintTable} from "./checkers/balances.js"
import {evmFetchDataAndPrintTable} from "./checkers/evm.js"
import {filterFetchDataAndPrintTable} from "./checkers/filter.js"
import {nftFetchDataAndPrintTable} from "./checkers/nft.js"
import {exec} from "child_process"
import {layerzeroFetchDataAndPrintTable} from "./checkers/layerzero.js"
import { baseFetchDataAndPrintTable } from "./checkers/base.js"

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

async function startMenu(menu) {
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
        case "zksync":
            await zkSyncFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "starknet":
            await starknetFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "layerzero":
            await layerzeroFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "zora":
            await zoraFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "base":
            await baseFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "aptos":
            await aptosFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "linea":
            await lineaFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "scroll":
            await scrollFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "evm":
            let chain = await evmNetwork()
            await evmFetchDataAndPrintTable(chain).catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "balances":
            let network = await chooiceNetwork()
            await balancesFetchDataAndPrintTable(network).catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "filter":
            await filterFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
            if (startOver) await startMenu()
            break
        case "nft":
            await nftFetchDataAndPrintTable().catch(error => { console.error('Произошла ошибка:', error)})
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
