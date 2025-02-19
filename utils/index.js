import { airdropChecker, chooiceNetwork, compareVersions, entryPoint, evmNetwork, pointsChecker, sleep } from "./common.js"
import fs from "fs"
import axios from "axios"
import { exec } from "child_process"
import { config } from '../user_data/config.js'
import { zkSyncFetchDataAndPrintTable } from "../checkers/zksync.js"
import { aptosFetchDataAndPrintTable } from "../checkers/aptos.js"
import { zoraFetchDataAndPrintTable } from "../checkers/zora.js"
import { lineaFetchDataAndPrintTable } from "../checkers/linea.js"
import { scrollFetchDataAndPrintTable } from "../checkers/scroll.js"
import { balancesFetchDataAndPrintTable } from "../checkers/balances.js"
import { evmFetchDataAndPrintTable } from "../checkers/evm.js"
import { layerzeroFetchDataAndPrintTable } from "../checkers/layerzero.js"
import { baseFetchDataAndPrintTable } from "../checkers/base.js"
import { wormholeFetchDataAndPrintTable } from "../checkers/wormhole.js"
import { zkbridgeFetchDataAndPrintTable } from "../checkers/zkbridge.js"
import { hyperlaneFetchDataAndPrintTable } from "../checkers/hyperlane.js"
import { clustersFetchDataAndPrintTable } from "../checkers/clusters.js"
import { debridgeFetchDataAndPrintTable } from "../checkers/debridge.js"
import { pohFetchDataAndPrintTable } from "../checkers/linea-poh-checker.js"
import { rabbyFetchDataAndPrintTable } from "../checkers/rabby.js"
import { galxeFetchDataAndPrintTable } from "../checkers/galxe.js"
import { polygonzkevmFetchDataAndPrintTable } from "../checkers/polygonzkevm.js"
import { jumperFetchDataAndPrintTable } from "../checkers/jumper.js"
import { storyFetchDataAndPrintTable } from "../checkers/story.js"
import { eclipseFetchDataAndPrintTable } from "../checkers/eclipse.js"
import { pointsFetchDataAndPrintTable } from "../checkers/points.js"
import { airdropFetchDataAndPrintTable } from "../checkers/airdrop.js"
import { morphFetchDataAndPrintTable } from "../checkers/morph.js"
import { soneiumFetchDataAndPrintTable } from "../checkers/soneium.js"
import { monadFetchDataAndPrintTable } from "../checkers/monad.js"

function startExpressServer() {
    const expressServer = exec('node ./utils/server.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`${error}`)
        }
        console.log(`${stdout}`)
    })

    expressServer.stdout.on('data', (data) => {
        console.log(`${data}`)
    })

    expressServer.stderr.on('data', (data) => {
        console.error(`${data}`)
    })
}

async function checkVersion() {
    fs.readFile('./package.json', 'utf8', async (err, content) => {
        if (err) {
            // console.error('Error reading file:', err)
            return
        }
        const packageInfo = JSON.parse(content)
        let actualVersion = 0

        
        await axios.get('https://munris.tech/checker-version.json').then(response => {
            actualVersion = response.data
        }).catch(error => {
            if (config.debug) console.log(error.toString())
        })

        if (actualVersion !== 0) {
            if (compareVersions(actualVersion, packageInfo.version)) {
                console.log('\x1b[31m', `Your version of Wallet checker is out of date. Please update it before use.`)
                console.log('\x1b[31m', `Actual: ${actualVersion} Local: ${packageInfo.version}`)
                console.log('\x1b[0m')
                await sleep(5000)
            }
        }
    })
}

async function startMenu(menu) {

    if (!fs.existsSync('./results')){
        fs.mkdirSync('./results')
    }
    
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
        case "monad":
            await monadFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "eclipse":
            await eclipseFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "soneium":
            await soneiumFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "story":
            await storyFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "morph":
            await morphFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "jumper":
            await jumperFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "rabby":
            await rabbyFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "clusters":
            await clustersFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "zksync":
            await zkSyncFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "debridge":
            await debridgeFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "wormhole":
            await wormholeFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "zkbridge":
            await zkbridgeFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "hyperlane":
            await hyperlaneFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "layerzero":
            await layerzeroFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "layerzero_extended":
            await layerzeroFetchDataAndPrintTable(true).catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "zora":
            await zoraFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "base":
            await baseFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "aptos":
            await aptosFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "linea":
            await lineaFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "scroll":
            await scrollFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "evm":
            let chain = await evmNetwork()
            await evmFetchDataAndPrintTable(chain).catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "balances":
            let network = await chooiceNetwork()
            await balancesFetchDataAndPrintTable(network).catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "points":
            let project = await pointsChecker()
            await pointsFetchDataAndPrintTable(project).catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "airdrop":
            let airdropProject = await airdropChecker()
            await airdropFetchDataAndPrintTable(airdropProject).catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "linea-poh":
            await pohFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "galxe":
            await galxeFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
        case "polygonzkevm":
            await polygonzkevmFetchDataAndPrintTable().catch(error => { console.error('Error: ', error) })
            if (startOver) await startMenu()
            break
    }
}

const args = process.argv.slice(2)
let mode = args[0]

if (mode === 'web') {
    await checkVersion()
    await sleep(1000)
    startExpressServer()
} else {
    await startMenu(mode)
}
